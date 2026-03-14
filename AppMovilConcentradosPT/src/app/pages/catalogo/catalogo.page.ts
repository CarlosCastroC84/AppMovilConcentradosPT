import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CatalogoPage implements OnInit {
  // Inyección de dependencias
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private toastController = inject(ToastController);

  // Variables de estado
  productos: Product[] = [];
  cargando: boolean = true;
  error: string | null = null;

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.cargando = true;
    this.productService.getProducts().subscribe({
      next: (data: any) => {
        console.log('Respuesta de API Gateway:', data);
        
        // Ajuste en caso de que API Gateway no se haya configurado "Proxy Integration", 
        // pasará el JSON de Lambda encapsulado dentro de otro "body"
        let productosList = data;
        if (data && data.body) {
           productosList = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        }

        this.productos = Array.isArray(productosList) ? productosList : [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando catálogo:', err);
        this.error = 'No se pudieron cargar los productos. Intenta más tarde.';
        this.cargando = false;
      }
    });
  }

  async agregarAlCarrito(producto: Product) {
    // Adaptamos el producto de AWS al formato que espera tu CartService actual
    this.cartService.addItem({
      id: producto.id,
      name: producto.nombre,
      emoji: '📦', // Un emoji por defecto
      presentation: producto.presentacion,
      price: producto.precio
    });

    const toast = await this.toastController.create({
      message: `${producto.nombre} agregado al pedido`,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
}
