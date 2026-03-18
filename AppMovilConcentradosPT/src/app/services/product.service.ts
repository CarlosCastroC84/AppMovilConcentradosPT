import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, timeout } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';
import { unwrapApiArray, unwrapApiEntity, unwrapApiResponse } from '../utils/api-response.util';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private static readonly requestTimeoutMs = 12000;
  private http = inject(HttpClient);
  private apiUrl = `${environment.awsConfig.apiUrl}/productos`;

  constructor() { }

  /**
   * Obtiene la lista completa de productos desde DynamoDB a través de API Gateway
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      timeout(ProductService.requestTimeoutMs),
      map(response => unwrapApiArray<Product>(response))
    );
  }

  createProduct(productData: Product): Observable<Product> {
    return this.http.post<unknown>(this.apiUrl, productData).pipe(
      timeout(ProductService.requestTimeoutMs),
      switchMap(response => this.resolveMutationProduct(response, productData))
    );
  }

  updateProduct(productData: Product): Observable<Product> {
    return this.http.put<unknown>(this.apiUrl, productData).pipe(
      timeout(ProductService.requestTimeoutMs),
      switchMap(response => this.resolveMutationProduct(response, productData))
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<unknown>(this.apiUrl, {
      body: { id }
    }).pipe(
      timeout(ProductService.requestTimeoutMs),
      map(response => {
        unwrapApiResponse(response);
        return void 0;
      })
    );
  }

  private resolveMutationProduct(response: unknown, fallbackProduct: Product): Observable<Product> {
    const product = unwrapApiEntity<Product | null>(response, ['producto', 'product', 'item', 'data']);

    if (product && typeof product === 'object' && 'id' in product) {
      return of(product);
    }

    return this.getProducts().pipe(
      map(products => {
        const persistedProduct = products.find(item => item.id === fallbackProduct.id);
        if (!persistedProduct) {
          throw new Error('La API no confirmó el guardado del producto en DynamoDB.');
        }

        return persistedProduct;
      })
    );
  }
}
