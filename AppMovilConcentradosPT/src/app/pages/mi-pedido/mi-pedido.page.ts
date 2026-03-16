import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { Order } from '../../models/order.model';

interface CheckoutDraft {
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  observations: string;
}

const CHECKOUT_DRAFT_KEY = 'checkout_draft';

@Component({
  selector: 'app-mi-pedido',
  templateUrl: './mi-pedido.page.html',
  styleUrls: ['./mi-pedido.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class MiPedidoPage implements OnInit {
  public cart = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private router = inject(Router);



  // Variables del formulario
  customerName = '';
  customerPhone = '';
  customerLocation = '';
  observations = '';

  async ngOnInit(): Promise<void> {
    await this.loadDraft();
  }

  formatPrice(value: number): string {
    return '$' + value.toLocaleString('es-CO');
  }

  persistDraft(): void {
    const draft: CheckoutDraft = {
      customerName: this.customerName.trim(),
      customerPhone: this.customerPhone.trim(),
      customerLocation: this.customerLocation.trim(),
      observations: this.observations.trim()
    };

    const isEmpty = Object.values(draft).every(value => value === '');
    if (isEmpty) {
      void this.clearDraft();
      return;
    }

    void this.storageService.setJson(CHECKOUT_DRAFT_KEY, draft);
  }

  async procesarPedido() {
    const customerName = this.customerName.trim();
    const customerPhone = this.customerPhone.trim();
    const customerLocation = this.customerLocation.trim();
    const observations = this.observations.trim();

    if (this.cart.cartItems.length === 0) {
      this.mostrarMensaje('Tu carrito está vacío. Agrega productos antes de enviar el pedido.', 'warning');
      return;
    }

    if (!customerName || !customerPhone) {
      this.mostrarMensaje('Por favor ingresa tu Nombre y Celular.', 'warning');
      return;
    }
    if (!this.isValidPhone(customerPhone)) {
      this.mostrarMensaje('Ingresa un celular válido con al menos 10 dígitos.', 'warning');
      return;
    }


    const loading = await this.loadingController.create({
      message: 'Enviando pedido a Distribuidora de Concentrados Puente Tierra...',
      spinner: 'circles'
    });

    try {
      await loading.present();

      const currentUser = await this.authService.getCurrentUser();

      const newOrder: Partial<Order> = {
        id: `ORD-${Date.now()}`,
        userId: currentUser?.userId || 'GUEST',
        customerName,
        customerPhone,
        customerLocation,
        customerEmail: currentUser?.email,
        total: this.cart.subtotal,
        status: 'PENDING',
        observations,
        createdAt: new Date().toISOString(),
        items: this.cart.cartItems.map(item => ({ ...item }))
      };

      this.orderService.createOrder(newOrder).subscribe({
        next: async () => {
          await loading.dismiss();

          const pedidoId = newOrder.id || `ORD-${Date.now()}`;
          const total = this.cart.subtotal;

          this.cart.clearCart();
          await this.clearDraft();

          this.customerName = '';
          this.customerPhone = '';
          this.customerLocation = '';
          this.observations = '';

          await this.router.navigate(['/confirmacion-pedido-cliente'], {
            replaceUrl: true,
            queryParams: {
              pedidoId,
              customerName,
              customerLocation,
              total
            }
          });

        },
        error: async (err: Error) => {
          await loading.dismiss();
          console.error('Error enviando pedido:', err);
          await this.mostrarMensaje(
            err.message || 'Hubo un error al guardar tu pedido. Intenta nuevamente.',
            'danger'
          );
        }
      });
    } catch (error) {
      await loading.dismiss();
      console.error('Error preparando el pedido:', error);
      await this.mostrarMensaje('No fue posible preparar el pedido. Intenta nuevamente.', 'danger');
    }
  }


  private async loadDraft(): Promise<void> {
    const draft = await this.storageService.getJson<CheckoutDraft>(CHECKOUT_DRAFT_KEY);
    if (!draft) {
      return;
    }

    this.customerName = draft.customerName ?? '';
    this.customerPhone = draft.customerPhone ?? '';
    this.customerLocation = draft.customerLocation ?? '';
    this.observations = draft.observations ?? '';
  }

  private async clearDraft(): Promise<void> {
    await this.storageService.remove(CHECKOUT_DRAFT_KEY);
  }
  private isValidPhone(phone: string): boolean {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
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
