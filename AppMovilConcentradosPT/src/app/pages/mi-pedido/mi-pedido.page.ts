import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-mi-pedido',
  templateUrl: './mi-pedido.page.html',
  styleUrls: ['./mi-pedido.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class MiPedidoPage {
  public cart = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  // Variables del formulario
  customerName = '';
  customerPhone = '';
  customerLocation = '';
  observations = '';

  formatPrice(value: number): string {
    return '$' + value.toLocaleString('es-CO');
  }

  async procesarPedido() {
    // Validamos que haya ingresado al menos el nombre
    if (!this.customerName || !this.customerPhone) {
      this.mostrarMensaje('Por favor ingresa tu Nombre y Celular', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Enviando pedido a AWS...',
      spinner: 'circles'
    });
    await loading.present();

    const currentUser = await this.authService.getCurrentUser();

    // Construimos el objeto del pedido
    const newOrder: Partial<Order> = {
      id: `ORD-${new Date().getTime()}`,
      userId: currentUser?.userId || 'GUEST',
      customerName: this.customerName.trim(),
      customerPhone: this.customerPhone.trim(),
      customerLocation: this.customerLocation.trim(),
      customerEmail: currentUser?.email,
      total: this.cart.subtotal,
      status: 'PENDING',
      observations: this.observations,
      createdAt: new Date().toISOString(),
      items: this.cart.cartItems.map(item => ({ ...item }))
    };

    // Llamamos a nuestro servicio de AWS
    this.orderService.createOrder(newOrder).subscribe({
      next: async () => {
        await loading.dismiss();
        this.mostrarMensaje('¡Pedido guardado en DynamoDB con éxito!', 'success');
        this.cart.clearCart(); // Vaciamos el carrito tras el éxito

        // Limpiamos el form
        this.customerName = '';
        this.customerPhone = '';
        this.customerLocation = '';
        this.observations = '';
      },
      error: async (err: Error) => {
        await loading.dismiss();
        console.error('Error enviando pedido:', err);
        this.mostrarMensaje(err.message || 'Hubo un error al guardar tu pedido en AWS. Por el momento enviémoslo por WhatsApp.', 'danger');
      }
    });
  }

  async mostrarMensaje(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }
}
