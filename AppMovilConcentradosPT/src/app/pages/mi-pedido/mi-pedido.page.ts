import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
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
        await this.clearDraft();

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
