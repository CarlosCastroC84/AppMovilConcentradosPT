import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { ProductService } from '../../services/product.service';
import { enrichCatalogProduct } from '../../utils/catalog-product.util';
import { firstValueFrom } from 'rxjs';
import { CustomerProfileService } from '../../services/customer-profile.service';
import { CustomerOrdersService } from '../../services/customer-orders.service';
import { CustomerCreateOrderRequest } from '../../models/customer-order.model';


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
  private customerOrdersService = inject(CustomerOrdersService);
  private authService = inject(AuthService);
  private customerProfileService = inject(CustomerProfileService);
  private storageService = inject(StorageService);
  private toastController = inject(ToastController);
  private router = inject(Router);
  readonly fallbackImage = 'assets/Logos_dpt.png';
  private productService = inject(ProductService);
  productImages: Record<string, string> = {};

  // Variables del formulario
  customerName = '';
  customerPhone = '';
  customerLocation = '';
  observations = '';

  async ngOnInit(): Promise<void> {
    await this.loadDraft();
    await this.prefillProfileData();
    this.loadProductImages();
  }

  formatPrice(value: number): string {
    return '$' + value.toLocaleString('es-CO');
  }

  getCartItemImage(item: { id: string; imageUrl?: string }): string {
    const storedImage = item.imageUrl?.trim();

    if (storedImage && storedImage !== this.fallbackImage) {
      return storedImage;
    }

    return this.productImages[item.id] || this.fallbackImage;
  }

  private loadProductImages(): void {
    this.productService.getProducts().subscribe({
      next: products => {
        this.productImages = products.reduce((acc, product) => {
          acc[product.id] = enrichCatalogProduct(product).resolvedImageUrl;
          return acc;
        }, {} as Record<string, string>);
      },
      error: err => {
        console.error('No fue posible cargar las imágenes del carrito.', err);
      }
    });
  }

  onCartImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.includes(this.fallbackImage)) {
      return;
    }

    image.src = this.fallbackImage;
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
      await this.mostrarMensaje('Tu carrito está vacío. Agrega productos antes de enviar el pedido.', 'warning');
      return;
    }

    if (!customerName || !customerPhone) {
      await this.mostrarMensaje('Por favor ingresa tu Nombre y Celular.', 'warning');
      return;
    }

    if (!this.isValidPhone(customerPhone)) {
      await this.mostrarMensaje('Ingresa un celular válido con al menos 10 dígitos.', 'warning');
      return;
    }

    try {
      if (!(await this.authService.isAuthenticated())) {
        await this.mostrarMensaje('Inicia sesión para confirmar tu pedido.', 'warning');
        this.persistDraft();
        await this.router.navigate(['/cuenta'], {
          queryParams: {
            mode: 'login',
            redirectTo: '/mi-pedido'
          }
        });
        return;
      }

      const profile = await firstValueFrom(this.customerProfileService.bootstrapProfile());
      if (!this.customerProfileService.isProfileComplete(profile)) {
        await this.mostrarMensaje('Completa tu perfil antes de confirmar el pedido.', 'warning');
        this.persistDraft();
        await this.router.navigate(['/perfil'], {
          queryParams: {
            complete: 1,
            redirectTo: '/mi-pedido'
          }
        });
        return;
      }

      const request: CustomerCreateOrderRequest = {
        observations,
        deliverySnapshot: {
          fullName: customerName,
          phone: customerPhone,
          municipality: customerLocation,
          addressReference: profile.addressReference
        },
        items: this.cart.cartItems.map(item => ({
          productId: item.id,
          presentation: item.presentation,
          quantity: item.quantity
        }))
      };

      this.customerOrdersService.createOrder(request, this.cart.cartItems).subscribe({
        next: async order => {
          const total = order.total || this.cart.subtotal;

          this.cart.clearCart();
          await this.clearDraft();

          this.customerName = '';
          this.customerPhone = '';
          this.customerLocation = '';
          this.observations = '';

          await this.router.navigate(['/confirmacion-pedido-cliente'], {
            replaceUrl: true,
            queryParams: {
              pedidoId: order.id,
              customerName,
              customerLocation,
              total
            }
          });
        },
        error: async (error: Error) => {
          await this.mostrarMensaje(
            error.message || 'Hubo un error al guardar tu pedido.',
            'danger'
          );
        }
      });
    } catch (error: any) {
      await this.mostrarMensaje(
        error?.message || 'No fue posible preparar el pedido. Intenta nuevamente.',
        'danger'
      );
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

  private async prefillProfileData(): Promise<void> {
    if (!(await this.authService.isAuthenticated())) {
      return;
    }

    try {
      const profile = await firstValueFrom(this.customerProfileService.bootstrapProfile());

      if (!this.customerName.trim()) {
        this.customerName = profile.fullName;
      }

      if (!this.customerPhone.trim()) {
        this.customerPhone = profile.phone;
      }

      if (!this.customerLocation.trim()) {
        this.customerLocation = profile.municipality;
      }
    } catch (error) {
      console.warn('No fue posible precargar el perfil del cliente en checkout.', error);
    }
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
