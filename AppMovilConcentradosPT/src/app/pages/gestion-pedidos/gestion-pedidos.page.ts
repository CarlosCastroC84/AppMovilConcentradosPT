import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { DeleteOrderRequest, Order, OrderStatus, UpdateOrderRequest } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { SessionProfileService } from '../../services/session-profile.service';
import { OrderDetailsModalComponent } from '../../components/order-details-modal/order-details-modal.component';
import { STAFF_PERMISSIONS } from '../../models/session-profile.model';
import {
  getOrderDisplayName,
  getOrderDisplayPhone,
  getOrderLocation,
  getOrderWhatsAppPhone
} from '../../utils/order-contact.util';

type DateFilter = 'TODOS' | 'HOY' | 'SEMANA' | 'MES';

@Component({
  selector: 'app-gestion-pedidos',
  templateUrl: './gestion-pedidos.page.html',
  styleUrls: ['./gestion-pedidos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, OrderDetailsModalComponent]
})
export class GestionPedidosPage implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private sessionProfileService = inject(SessionProfileService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  readonly statusOptions: Array<{ value: OrderStatus; label: string }> = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'PROCESSING', label: 'En proceso' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  currentUserInitials = 'PT';
  orders: Order[] = [];
  loading = true;
  error: string | null = null;
  searchTerm = '';
  statusFilter: OrderStatus | 'TODOS' = 'TODOS';
  dateFilter: DateFilter = 'TODOS';
  updatingOrderId: string | null = null;
  deletingOrderId: string | null = null;
  selectedOrder: Order | null = null;
  isDetailsModalOpen = false;
  private currentActor: string | null = null;

  async ngOnInit() {
    await this.loadCurrentUser();
    this.cargarPedidos();
  }

  get filteredOrders(): Order[] {
    const searchTerm = this.searchTerm.trim().toLowerCase();

    return [...this.orders]
      .filter(order => this.matchesStatus(order))
      .filter(order => this.matchesDate(order))
      .filter(order => this.matchesSearch(order, searchTerm))
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }

  get pendingOrders(): number {
    return this.orders.filter(order => order.status === 'PENDING').length;
  }

  get processingOrders(): number {
    return this.orders.filter(order => order.status === 'PROCESSING').length;
  }

  get completedOrders(): number {
    return this.orders.filter(order => order.status === 'COMPLETED').length;
  }

  get cancelledOrders(): number {
    return this.orders.filter(order => order.status === 'CANCELLED').length;
  }

  get salesToday(): number {
    return this.orders
      .filter(order => this.isSameDay(order.createdAt, new Date()))
      .reduce((total, order) => total + (order.total || 0), 0);
  }


  cargarPedidos() {
    this.loading = true;
    this.error = null;

    this.orderService.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.loading = false;
      },
      error: (error: Error) => {
        this.error = error.message || 'No fue posible cargar los pedidos.';
        this.loading = false;
      }
    });
  }

  resetFilters() {
    this.searchTerm = '';
    this.statusFilter = 'TODOS';
    this.dateFilter = 'TODOS';
  }

  onStatusChange(order: Order, nextStatus: OrderStatus | string) {
    if (!this.isOrderStatus(nextStatus) || nextStatus === order.status) {
      return;
    }

    this.updatingOrderId = order.id;
    const updatedAt = new Date().toISOString();
    const request: UpdateOrderRequest = {
      id: order.id,
      status: nextStatus,
      updatedAt,
      updatedBy: this.currentActor || undefined
    };
    const updatedOrder: Order = {
      ...order,
      status: nextStatus,
      updatedAt
    };

    this.orderService.updateOrder(request).subscribe({
      next: savedOrder => {
        this.upsertOrder(savedOrder ? { ...order, ...savedOrder } : updatedOrder);
        this.updatingOrderId = null;
        this.showToast(`Pedido ${order.id} actualizado a ${this.getStatusLabel(nextStatus)}.`, 'success');
      },
      error: (error: Error) => {
        this.updatingOrderId = null;
        this.showToast(error.message || 'No fue posible actualizar el pedido.', 'danger');
      }
    });
  }

  openOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.isDetailsModalOpen = true;
  }

  closeOrderDetails(): void {
    this.isDetailsModalOpen = false;
    this.selectedOrder = null;
  }

  get canCancelOrders(): boolean {
    return this.sessionProfileService.hasAnyPermission([
      STAFF_PERMISSIONS.ordersCancel,
      STAFF_PERMISSIONS.ordersManage
    ]);
  }

  get canReturnOrders(): boolean {
    return this.sessionProfileService.hasAnyPermission([
      STAFF_PERMISSIONS.ordersReturn,
      STAFF_PERMISSIONS.ordersManage
    ]);
  }

  get canCancelSelectedOrder(): boolean {
    return this.canCancelOrders
      && !!this.selectedOrder
      && (this.selectedOrder.status === 'PENDING' || this.selectedOrder.status === 'PROCESSING');
  }

  get canReturnSelectedOrderToSales(): boolean {
    return this.canReturnOrders
      && !!this.selectedOrder
      && this.selectedOrder.status === 'PROCESSING';
  }

  async confirmCancelSelectedOrder(): Promise<void> {
    if (!this.selectedOrder || !this.canCancelSelectedOrder) {
      return;
    }

    const order = this.selectedOrder;
    const alert = await this.alertController.create({
      header: 'Cancelar venta',
      message: `Se cancelará el pedido ${order.id}. Esta acción lo sacará del flujo de ventas y bodega.`,
      buttons: [
        {
          text: 'Volver',
          role: 'cancel'
        },
        {
          text: 'Cancelar venta',
          role: 'destructive',
          handler: () => this.applyOperationalStatusChange(order, 'CANCELLED', `Pedido ${order.id} cancelado.`)
        }
      ]
    });

    await alert.present();
  }

  async confirmReturnSelectedOrderToSales(): Promise<void> {
    if (!this.selectedOrder || !this.canReturnSelectedOrderToSales) {
      return;
    }

    const order = this.selectedOrder;
    const alert = await this.alertController.create({
      header: 'Devolver a ventas',
      message: `El pedido ${order.id} volverá a estado pendiente para que ventas lo retome.`,
      buttons: [
        {
          text: 'Volver',
          role: 'cancel'
        },
        {
          text: 'Devolver',
          handler: () => this.applyOperationalStatusChange(order, 'PENDING', `Pedido ${order.id} devuelto a ventas.`)
        }
      ]
    });

    await alert.present();
  }

  async confirmDelete(order: Order) {
    const alert = await this.alertController.create({
      header: 'Eliminar pedido',
      message: `Se eliminará el pedido ${order.id} del historial visible en la app.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteOrder(order)
        }
      ]
    });

    await alert.present();
  }

  openWhatsApp(order: Order) {
    const phone = this.getCustomerWhatsAppPhone(order);
    if (!phone) {
      this.showToast('Este pedido no tiene un celular válido para WhatsApp.', 'warning');
      return;
    }

    const message = encodeURIComponent(
      `Hola ${this.getCustomerDisplayName(order)}, tu pedido ${order.id} está en estado ${this.getStatusLabel(order.status)}.`
    );

    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener');
    }
  }

  getStatusLabel(status: OrderStatus): string {
    const option = this.statusOptions.find(item => item.value === status);
    return option?.label || status;
  }

  getStatusTone(status: OrderStatus): string {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'PROCESSING':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'gray';
      default:
        return 'yellow';
    }
  }

  getOrderCardClass(order: Order): Record<string, boolean> {
    const tone = this.getStatusTone(order.status);
    return {
      'border-yellow': tone === 'yellow',
      'border-blue': tone === 'blue',
      'border-green': tone === 'green',
      'border-gray': tone === 'gray',
      dispatched: order.status === 'COMPLETED'
    };
  }

  getCustomerDisplayName(order: Order): string {
    return getOrderDisplayName(order);
  }

  getCustomerPhone(order: Order): string | null {
    return getOrderDisplayPhone(order);
  }

  getCustomerWhatsAppPhone(order: Order): string | null {
    return getOrderWhatsAppPhone(order);
  }

  hasWhatsAppPhone(order: Order): boolean {
    return !!this.getCustomerWhatsAppPhone(order);
  }

  getCustomerLocation(order: Order): string | null {
    return getOrderLocation(order);
  }

  getItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  formatPrice(value: number): string {
    return `$${value.toLocaleString('es-CO')}`;
  }

  formatOrderDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Sin fecha';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const isPm = date.getHours() >= 12;
    const hour = date.getHours() % 12 || 12;
    const meridiem = isPm ? 'p.m.' : 'a.m.';

    return `${day}/${month}/${year} ${hour}:${minutes} ${meridiem}`;
  }

  trackByOrder(_index: number, order: Order): string {
    return order.id;
  }

  private async loadCurrentUser() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.currentUserInitials = this.buildInitials(user.name || user.username);
      this.currentActor = user.name || user.email || user.username;
    }
  }

  private deleteOrder(order: Order) {
    this.deletingOrderId = order.id;
    const timestamp = new Date().toISOString();

    const request: DeleteOrderRequest = {
      id: order.id,
      deletedAt: timestamp,
      updatedAt: timestamp,
      deletedBy: this.currentActor || undefined
    };

    this.orderService.deleteOrder(request).subscribe({
      next: () => {
        this.deletingOrderId = null;
        void this.showToast(`Pedido ${order.id} eliminado.`, 'success');
        this.cargarPedidos();
      },
      error: (error: Error) => {
        this.deletingOrderId = null;
        void this.showToast(error.message || 'No fue posible eliminar el pedido.', 'danger');
      }
    });
  }

  private matchesSearch(order: Order, searchTerm: string): boolean {
    if (!searchTerm) {
      return true;
    }

    const searchableText = [
      order.id,
      this.getCustomerDisplayName(order),
      this.getCustomerPhone(order) || '',
      this.getCustomerLocation(order) || '',
      order.customerEmail || ''
    ].join(' ').toLowerCase();

    return searchableText.includes(searchTerm);
  }

  private matchesStatus(order: Order): boolean {
    return this.statusFilter === 'TODOS' || order.status === this.statusFilter;
  }

  private matchesDate(order: Order): boolean {
    if (this.dateFilter === 'TODOS') {
      return true;
    }

    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - orderDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    switch (this.dateFilter) {
      case 'HOY':
        return this.isSameDay(order.createdAt, now);
      case 'SEMANA':
        return diffInDays <= 7;
      case 'MES':
        return diffInDays <= 30;
      default:
        return true;
    }
  }

  private isSameDay(dateValue: string, referenceDate: Date): boolean {
    const date = new Date(dateValue);
    return date.toDateString() === referenceDate.toDateString();
  }

  private isOrderStatus(value: string): value is OrderStatus {
    return this.statusOptions.some(option => option.value === value);
  }

  private upsertOrder(order: Order) {
    const index = this.orders.findIndex(item => item.id === order.id);
    if (index >= 0) {
      this.orders = [
        ...this.orders.slice(0, index),
        order,
        ...this.orders.slice(index + 1)
      ];
      return;
    }

    this.orders = [...this.orders, order];
  }

  private buildInitials(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'PT';
    }

    return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2500,
      position: 'top'
    });

    await toast.present();
  }

  private applyOperationalStatusChange(order: Order, nextStatus: OrderStatus, successMessage: string): void {
    this.updatingOrderId = order.id;
    const updatedAt = new Date().toISOString();
    const request: UpdateOrderRequest = {
      id: order.id,
      status: nextStatus,
      updatedAt,
      updatedBy: this.currentActor || undefined
    };

    const updatedOrder: Order = {
      ...order,
      status: nextStatus,
      updatedAt
    };

    this.orderService.updateOrder(request).subscribe({
      next: savedOrder => {
        const resolvedOrder = savedOrder ? { ...order, ...savedOrder } : updatedOrder;
        this.upsertOrder(resolvedOrder);
        this.updatingOrderId = null;

        if (this.selectedOrder?.id === order.id) {
          this.closeOrderDetails();
        }

        void this.showToast(successMessage, 'success');
      },
      error: (error: Error) => {
        this.updatingOrderId = null;
        void this.showToast(error.message || 'No fue posible actualizar el pedido.', 'danger');
      }
    });
  }
}
