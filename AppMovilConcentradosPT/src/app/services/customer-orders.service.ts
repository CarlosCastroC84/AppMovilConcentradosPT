import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CustomerCreateOrderRequest,
  CustomerDeliverySnapshot,
  CustomerOrderItem,
  CustomerOrderView
} from '../models/customer-order.model';
import { AuthService, AuthenticatedUser } from './auth.service';
import { StorageService } from './storage.service';
import { CartItem } from '../models/cart-item.model';
import { OrderStatus } from '../models/order.model';
import { unwrapApiArray, unwrapApiEntity, unwrapApiResponse } from '../utils/api-response.util';

@Injectable({
  providedIn: 'root'
})
export class CustomerOrdersService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private apiUrl = `${environment.awsConfig.apiUrl}/clientes/pedidos`;

  listOrders(): Observable<CustomerOrderView[]> {
    return from(this.listOrdersInternal());
  }

  getOrderById(orderId: string): Observable<CustomerOrderView | null> {
    return from(this.getOrderByIdInternal(orderId));
  }

  createOrder(
    request: CustomerCreateOrderRequest,
    cartItems: readonly CartItem[]
  ): Observable<CustomerOrderView> {
    return from(this.createOrderInternal(request, cartItems));
  }

  private async listOrdersInternal(): Promise<CustomerOrderView[]> {
    const currentUser = await this.requireCurrentUser();

    try {
      const response = await this.http.get<unknown>(this.apiUrl).toPromise();
      const orders = unwrapApiArray<unknown>(response, ['items', 'orders', 'pedidos', 'data'])
        .map(item => this.normalizeOrder(item, currentUser))
        .filter((order): order is CustomerOrderView => Boolean(order))
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

      await this.persistOrders(currentUser.userId, orders);
      return orders;
    } catch (error) {
      const cachedOrders = await this.readCachedOrders(currentUser.userId);
      if (cachedOrders.length > 0) {
        return cachedOrders;
      }

      if (this.canFallbackToLocalList(error)) {
        console.warn('No fue posible cargar /clientes/pedidos. Se mostrará historial local vacío hasta que el backend esté disponible.', error);
        return [];
      }

      throw new Error(this.buildOrdersErrorMessage(error, 'No fue posible cargar tus pedidos.'));
    }
  }

  private async getOrderByIdInternal(orderId: string): Promise<CustomerOrderView | null> {
    const currentUser = await this.requireCurrentUser();

    try {
      const response = await this.http.get<unknown>(`${this.apiUrl}/${encodeURIComponent(orderId)}`).toPromise();
      const order = this.normalizeOrder(
        unwrapApiEntity<unknown | null>(response, ['pedido', 'order', 'item', 'data']),
        currentUser
      );

      if (!order) {
        return null;
      }

      const cachedOrders = await this.readCachedOrders(currentUser.userId);
      await this.persistOrders(currentUser.userId, this.upsertOrder(cachedOrders, order));
      return order;
    } catch (error) {
      const cachedOrders = await this.readCachedOrders(currentUser.userId);
      return cachedOrders.find(order => order.id === orderId) || null;
    }
  }

  private async createOrderInternal(
    request: CustomerCreateOrderRequest,
    cartItems: readonly CartItem[]
  ): Promise<CustomerOrderView> {
    const currentUser = await this.requireCurrentUser();
    const normalizedRequest = this.normalizeCreateRequest(request);

    try {
      const response = await this.http.post<unknown>(this.apiUrl, normalizedRequest).toPromise();
      const rawEntity = unwrapApiEntity<unknown | null>(response, ['pedido', 'order', 'item', 'data']);
      const order =
        this.normalizeOrder(rawEntity, currentUser) ||
        this.buildOrderFromDraft(
          currentUser,
          normalizedRequest,
          cartItems,
          this.readReturnedOrderId(response)
        );

      const cachedOrders = await this.readCachedOrders(currentUser.userId);
      await this.persistOrders(currentUser.userId, this.upsertOrder(cachedOrders, order));
      return order;
    } catch (error) {
      if (this.canFallbackToLocalOrder(error)) {
        const localOrder = this.buildOrderFromDraft(currentUser, normalizedRequest, cartItems);
        const cachedOrders = await this.readCachedOrders(currentUser.userId);
        await this.persistOrders(currentUser.userId, this.upsertOrder(cachedOrders, localOrder));
        return localOrder;
      }

      throw new Error(this.buildOrdersErrorMessage(error, 'No fue posible guardar tu pedido.'));
    }
  }

  private normalizeCreateRequest(request: CustomerCreateOrderRequest): CustomerCreateOrderRequest {
    return {
      observations: request.observations?.trim() || undefined,
      deliverySnapshot: {
        fullName: request.deliverySnapshot.fullName.trim(),
        phone: request.deliverySnapshot.phone.trim(),
        municipality: request.deliverySnapshot.municipality.trim(),
        addressReference: request.deliverySnapshot.addressReference?.trim() || undefined
      },
      items: request.items.map(item => ({
        productId: item.productId,
        presentation: item.presentation,
        quantity: item.quantity
      }))
    };
  }

  private normalizeOrder(input: unknown, currentUser: AuthenticatedUser): CustomerOrderView | null {
    if (!input || typeof input !== 'object') {
      return null;
    }

    const record = input as Record<string, unknown>;
    const deliverySnapshot = this.normalizeDeliverySnapshot(record['deliverySnapshot'], record);
    const items = this.readItems(record['items']);

    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }

    const itemCount = this.readNumber(record, ['itemCount']) ?? items.reduce((total, item) => total + item.quantity, 0);
    const leadProduct = items[0];
    const createdAt = this.pickDateString(record, ['createdAt', 'fechaCreacion']) || new Date().toISOString();

    return {
      id: this.pickString(record, ['id', 'orderId', 'pedidoId']) || `ORD-${Date.now()}`,
      userId: this.pickString(record, ['userId', 'sub']) || currentUser.userId,
      customerName: deliverySnapshot.fullName,
      customerPhone: deliverySnapshot.phone,
      customerLocation: deliverySnapshot.municipality,
      customerEmail: this.pickString(record, ['customerEmail', 'email']) || currentUser.email,
      total: this.readNumber(record, ['total', 'amount']) ?? this.calculateTotal(items),
      status: this.normalizeStatus(record['status']),
      observations: this.pickString(record, ['observations', 'notas']) || undefined,
      createdAt,
      updatedAt: this.pickDateString(record, ['updatedAt', 'fechaActualizacion']) || undefined,
      items,
      deliverySnapshot,
      itemCount,
      leadProductName:
        this.pickString(record, ['leadProductName', 'primaryProductName']) ||
        leadProduct.name,
      leadProductImageUrl:
        this.pickString(record, ['leadProductImageUrl', 'primaryProductImage']) ||
        leadProduct.imageUrl ||
        undefined
    };
  }

  private normalizeDeliverySnapshot(
    value: unknown,
    fallbackRecord: Record<string, unknown>
  ): CustomerDeliverySnapshot {
    const source = typeof value === 'object' && value !== null
      ? value as Record<string, unknown>
      : fallbackRecord;

    return {
      fullName:
        this.pickString(source, ['fullName', 'customerName', 'name']) ||
        'Cliente',
      phone:
        this.pickString(source, ['phone', 'customerPhone', 'celular']) ||
        '',
      municipality:
        this.pickString(source, ['municipality', 'customerLocation', 'location']) ||
        '',
      addressReference:
        this.pickString(source, ['addressReference', 'reference', 'referencia']) ||
        undefined
    };
  }

  private readItems(value: unknown): CustomerOrderItem[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map(item => this.normalizeItem(item))
      .filter((item): item is CustomerOrderItem => item !== null);
  }

  private normalizeItem(value: unknown): CustomerOrderItem | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const id = this.pickString(record, ['productId', 'id']) || `ITEM-${Date.now()}`;
    const presentation = this.pickString(record, ['presentation', 'presentacion']) || 'Presentación';

    return {
      id,
      productId: this.pickString(record, ['productId']) || id,
      name:
        this.pickString(record, ['name', 'productName', 'nombre']) ||
        'Producto',
      presentation,
      price: this.readNumber(record, ['price', 'precio', 'unitPrice']) ?? 0,
      quantity: this.readNumber(record, ['quantity', 'cantidad']) ?? 1,
      imageUrl: this.pickString(record, ['imageUrl', 'imagenUrl']) || undefined
    };
  }

  private buildOrderFromDraft(
    currentUser: AuthenticatedUser,
    request: CustomerCreateOrderRequest,
    cartItems: readonly CartItem[],
    orderId?: string | null
  ): CustomerOrderView {
    const createdAt = new Date().toISOString();
    const items = cartItems.map(item => ({
      ...item,
      productId: item.id
    }));
    const leadProduct = items[0];

    return {
      id: orderId || `LOCAL-${Date.now()}`,
      userId: currentUser.userId,
      customerName: request.deliverySnapshot.fullName,
      customerPhone: request.deliverySnapshot.phone,
      customerLocation: request.deliverySnapshot.municipality,
      customerEmail: currentUser.email,
      total: this.calculateTotal(items),
      status: 'PENDING',
      observations: request.observations,
      createdAt,
      items,
      deliverySnapshot: request.deliverySnapshot,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      leadProductName: leadProduct?.name || 'Pedido',
      leadProductImageUrl: leadProduct?.imageUrl || undefined
    };
  }

  private calculateTotal(items: readonly CustomerOrderItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  private readReturnedOrderId(response: unknown): string | null {
    const payload = unwrapApiResponse<unknown>(response);
    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    const record = payload as Record<string, unknown>;
    const orderId = record['orderId'] ?? record['pedidoId'] ?? record['id'];

    return typeof orderId === 'string' && orderId.trim()
      ? orderId.trim()
      : null;
  }

  private canFallbackToLocalOrder(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return true;
    }

    return error.status === 0 || error.status === 404 || error.status === 405;
  }

  private canFallbackToLocalList(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    return error.status === 0 || error.status === 404 || error.status === 405;
  }

  private buildOrdersErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    if (error.status === 0) {
      return 'No fue posible conectar con la API de clientes. Se requiere backend o conectividad para sincronizar.';
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }

    if (typeof error.error === 'object' && error.error !== null) {
      const record = error.error as Record<string, unknown>;
      for (const key of ['message', 'error', 'details']) {
        const value = record[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }

    return fallbackMessage;
  }

  private normalizeStatus(value: unknown): OrderStatus {
    if (typeof value !== 'string') {
      return 'PENDING';
    }

    switch (value.trim().toUpperCase()) {
      case 'PROCESSING':
        return 'PROCESSING';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  private async requireCurrentUser(): Promise<AuthenticatedUser> {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Debes iniciar sesión para consultar tus pedidos.');
    }

    return currentUser;
  }

  private buildCacheKey(userId: string): string {
    return `customer_orders_${userId}`;
  }

  private async readCachedOrders(userId: string): Promise<CustomerOrderView[]> {
    const cachedOrders = await this.storageService.getJson<CustomerOrderView[]>(this.buildCacheKey(userId));
    return Array.isArray(cachedOrders) ? cachedOrders : [];
  }

  private persistOrders(userId: string, orders: CustomerOrderView[]): Promise<void> {
    return this.storageService.setJson(this.buildCacheKey(userId), orders);
  }

  private upsertOrder(orders: CustomerOrderView[], order: CustomerOrderView): CustomerOrderView[] {
    const nextOrders = orders.filter(item => item.id !== order.id);
    return [order, ...nextOrders]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }

  private pickString(record: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private readNumber(record: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private pickDateString(record: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
    }

    return null;
  }
}
