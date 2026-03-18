import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CartService } from './cart.service';
import { ProductService } from './product.service';
import { CustomerOrderView } from '../models/customer-order.model';
import { enrichCatalogProduct } from '../utils/catalog-product.util';

@Injectable({
  providedIn: 'root'
})
export class CustomerReorderService {
  private cartService = inject(CartService);
  private productService = inject(ProductService);

  async reorder(order: CustomerOrderView): Promise<{ addedCount: number; missingCount: number }> {
    const products = await firstValueFrom(this.productService.getProducts());
    const activeProducts = products
      .filter(product => product.estado !== 'INACTIVO')
      .map(product => enrichCatalogProduct(product));

    let addedCount = 0;
    let missingCount = 0;

    for (const orderItem of order.items) {
      const productId = orderItem.productId || orderItem.id;
      const match = activeProducts.find(product =>
        product.id === productId &&
        product.presentacion === orderItem.presentation
      );

      if (!match) {
        missingCount++;
        continue;
      }

      this.cartService.addItem({
        id: match.id,
        name: match.nombre,
        emoji: '📦',
        presentation: match.presentacion,
        price: match.precio,
        imageUrl: match.resolvedImageUrl
      }, orderItem.quantity);

      addedCount++;
    }

    return { addedCount, missingCount };
  }
}
