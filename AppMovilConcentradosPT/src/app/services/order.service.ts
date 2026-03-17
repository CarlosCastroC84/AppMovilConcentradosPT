import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { DeleteOrderRequest, Order, UpdateOrderRequest } from '../models/order.model';
import { environment } from '../../environments/environment';
import { unwrapApiArray, unwrapApiEntity, unwrapApiResponse } from '../utils/api-response.util';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.awsConfig.apiUrl}/pedidos`;

  constructor() { }

  /**
   * Obtiene todos los pedidos desde DynamoDB
   */
  getOrders(): Observable<Order[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map(response => unwrapApiArray<Order>(response).filter(order => !order.deletedAt)),
      catchError(error => this.handleHttpError(error, 'No fue posible cargar los pedidos.', 'GET'))
    );
  }

  /**
   * Envía un nuevo pedido a AWS (Lambda guardará en DynamoDB)
   */
  createOrder(orderData: Partial<Order>): Observable<{ message?: string; orderId?: string }> {
    return this.http.post<unknown>(this.apiUrl, orderData).pipe(
      map(response => unwrapApiResponse<{ message?: string; orderId?: string }>(response)),
      catchError(error => this.handleHttpError(error, 'No fue posible crear el pedido.', 'POST'))
    );
  }

  updateOrder(orderData: UpdateOrderRequest): Observable<Order | null> {
    return this.http.put<unknown>(this.apiUrl, orderData).pipe(
      map(response => {
        const order = unwrapApiEntity<Order | null>(response, ['pedido', 'order', 'item', 'data']);
        return order && typeof order === 'object' && 'id' in order
          ? order
          : null;
      }),
      catchError(error => this.handleHttpError(error, 'No fue posible actualizar el pedido.', 'PUT'))
    );
  }

  deleteOrder(request: DeleteOrderRequest): Observable<void> {
    return this.http.request<unknown>('delete', this.apiUrl, {
      body: request
    }).pipe(
      map(response => {
        unwrapApiResponse(response);
        return void 0;
      }),
      catchError(error => this.handleHttpError(error, 'No fue posible eliminar el pedido.', 'DELETE'))
    );
  }

  private handleHttpError(
    error: unknown,
    fallbackMessage: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  ): Observable<never> {
    return throwError(() => new Error(this.buildHttpErrorMessage(error, fallbackMessage, method)));
  }

  private buildHttpErrorMessage(
    error: unknown,
    fallbackMessage: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  ): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    if (error.status === 0) {
      return 'No fue posible conectar con la API de pedidos. Revisa la red, CORS o la disponibilidad de AWS.';
    }

    if (error.status === 405) {
      return `La API de pedidos no permite ${method}. Verifica el método en API Gateway y el despliegue del stage prod.`;
    }

    const payload = this.parseErrorPayload(error.error);
    if (payload) {
      return payload;
    }

    if (error.message?.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }

  private parseErrorPayload(payload: unknown): string | null {
    if (!payload) {
      return null;
    }

    if (typeof payload === 'string') {
      const trimmedPayload = payload.trim();
      if (!trimmedPayload) {
        return null;
      }

      try {
        return this.parseErrorPayload(JSON.parse(trimmedPayload));
      } catch {
        return trimmedPayload;
      }
    }

    if (typeof payload === 'object') {
      const candidate = payload as Record<string, unknown>;
      for (const key of ['message', 'error', 'details']) {
        const value = candidate[key];
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      }
    }

    return null;
  }
}
