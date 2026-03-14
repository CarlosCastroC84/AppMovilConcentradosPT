import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../models/order.model';
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
      map(response => unwrapApiArray<Order>(response))
    );
  }

  /**
   * Envía un nuevo pedido a AWS (Lambda guardará en DynamoDB)
   */
  createOrder(orderData: Partial<Order>): Observable<{ message?: string; orderId?: string }> {
    return this.http.post<unknown>(this.apiUrl, orderData).pipe(
      map(response => unwrapApiResponse<{ message?: string; orderId?: string }>(response))
    );
  }

  updateOrder(orderData: Partial<Order> & Pick<Order, 'id'>): Observable<Order> {
    return this.http.put<unknown>(this.apiUrl, orderData).pipe(
      map(response => {
        const order = unwrapApiEntity<Order | null>(response, ['pedido', 'order', 'item', 'data']);
        return order && typeof order === 'object' && 'id' in order
          ? order
          : ({
              ...orderData,
              items: orderData.items ?? [],
              userId: orderData.userId ?? 'GUEST',
              customerName: orderData.customerName ?? 'Sin nombre',
              total: orderData.total ?? 0,
              status: orderData.status ?? 'PENDING',
              createdAt: orderData.createdAt ?? new Date().toISOString()
            } as Order);
      })
    );
  }

  deleteOrder(id: string): Observable<void> {
    return this.http.delete<unknown>(this.apiUrl, {
      body: { id }
    }).pipe(
      map(response => {
        unwrapApiResponse(response);
        return void 0;
      })
    );
  }
}
