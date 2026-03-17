import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CatalogProductView, enrichCatalogProduct } from '../../utils/catalog-product.util';
import { Product } from '../../models/product.model';
import { IonicModule } from '@ionic/angular';
import { AppToastService } from '../../services/app-toast.service';



@Component({
  selector: 'app-detalle-producto',
  templateUrl: './detalle-producto.page.html',
  styleUrls: ['./detalle-producto.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DetalleProductoPage implements OnInit {
  readonly fallbackImage = 'assets/Logos_dpt.png';

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  public cart = inject(CartService);
  private appToastService = inject(AppToastService);

  product: CatalogProductView | null = null;
  cargando = true;
  error: string | null = null;
  quantity = 1;
  selectedPresentation = '';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');

      this.quantity = 1;
      this.product = null;
      this.error = null;

      if (!id) {
        this.cargando = false;
        this.error = 'No se recibió un producto válido.';
        return;
      }

      this.cargarProducto(id);
    });
  }

  decreaseQty() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQty() {
    this.quantity++;
  }

  async agregarAlPedido() {
    if (!this.product) {
      return;
    }

    this.cart.addItem({
      id: this.product.id,
      name: this.product.nombre,
      emoji: '📦',
      presentation: this.selectedPresentation || this.product.presentacion,
      price: this.product.precio,
      imageUrl: this.product.resolvedImageUrl
    }, this.quantity);

    await this.appToastService.showCartAdded(this.product.nombre, this.quantity);
  }

  onProductImageError(event: Event) {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.includes(this.fallbackImage)) {
      return;
    }

    image.src = this.fallbackImage;
  }

  private cargarProducto(id: string) {
    this.cargando = true;
    this.error = null;

    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        const product = products
          .filter(item => item.estado !== 'INACTIVO')
          .map(item => enrichCatalogProduct(item))
          .find(item => item.id === id);

        if (!product) {
          this.product = null;
          this.error = 'No encontramos este producto.';
          this.cargando = false;
          return;
        }

        this.product = product;
        this.selectedPresentation = product.presentacion;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando detalle del producto:', err);
        this.product = null;
        this.error = 'No fue posible cargar el detalle del producto.';
        this.cargando = false;
      }
    });
  }
}
