import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';
import { unwrapApiArray, unwrapApiEntity, unwrapApiResponse } from '../utils/api-response.util';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.awsConfig.apiUrl}/productos`;

  constructor() { }

  /**
   * Obtiene la lista completa de productos desde DynamoDB a través de API Gateway
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map(response => unwrapApiArray<Product>(response))
    );
  }

  createProduct(productData: Product): Observable<Product> {
    return this.http.post<unknown>(this.apiUrl, productData).pipe(
      map(response => {
        const product = unwrapApiEntity<Product | null>(response, ['producto', 'product', 'item', 'data']);
        return product && typeof product === 'object' && 'id' in product ? product : productData;
      })
    );
  }

  updateProduct(productData: Product): Observable<Product> {
    return this.http.put<unknown>(this.apiUrl, productData).pipe(
      map(response => {
        const product = unwrapApiEntity<Product | null>(response, ['producto', 'product', 'item', 'data']);
        return product && typeof product === 'object' && 'id' in product ? product : productData;
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
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
