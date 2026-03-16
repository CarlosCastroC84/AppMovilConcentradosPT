import { Component, NgZone, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, NavController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { SessionProfileService } from '../../services/session-profile.service';
import { SessionModule } from '../../models/session-profile.model';
import { Product } from '../../models/product.model';
import { CatalogProductView, enrichCatalogProduct } from '../../utils/catalog-product.util';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-panel-admin',
  templateUrl: './panel-admin.page.html',
  styleUrls: ['./panel-admin.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PanelAdminPage implements OnInit {
  readonly fallbackImage = 'assets/Logos_dpt.png';

  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private alertController = inject(AlertController);
  private router = inject(Router);
  private sessionProfileService = inject(SessionProfileService);
  private zone = inject(NgZone);
  private navController = inject(NavController);


  currentRole: string = 'ADMIN';
  availableModules: SessionModule[] = [];
  currentUser: string = 'Administrador';
  pedidos: any[] = [];
  productos: CatalogProductView[] = [];
  loadingPedidos = true;
  loadingProductos = true;
  previewProduct: CatalogProductView | null = null;

  // KPIs calculados
  get totalVentasHoy(): number {
    return this.pedidos.reduce((sum, p) => sum + (p.total || 0), 0);
  }

  get pedidosPendientes(): number {
    return this.pedidos.filter(p => p.status === 'PENDING').length;
  }

  get totalProductos(): number {
    return this.productos.length;
  }

  get canViewSales(): boolean {
    return this.sessionProfileService.hasPermission('sales.view');
  }

  get canViewOrders(): boolean {
    return this.sessionProfileService.hasPermission('orders.view');
  }

  get canManageProducts(): boolean {
    return this.sessionProfileService.hasPermission('products.manage');
  }

  async ngOnInit() {
    // Obtenemos el nombre real del usuario logueado
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user.name || user.email || user.username;
    }

    try {
      const profile =
        this.sessionProfileService.profile ||
        await firstValueFrom(this.sessionProfileService.loadProfile());

      this.currentRole = profile.role;
      this.availableModules = profile.modules || [];
    } catch (error) {
      console.error('No fue posible cargar el perfil del panel:', error);
      this.availableModules = [];
    }



    // Cargamos pedidos desde DynamoDB
    this.orderService.getOrders().subscribe({
      next: (data: any) => {
        // Manejar respuesta con o sin proxy
        if (Array.isArray(data)) {
          this.pedidos = data;
        } else if (data?.body) {
          this.pedidos = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        } else {
          this.pedidos = [];
        }
        // Ordenar por fecha, más recientes primero
        this.pedidos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loadingPedidos = false;
      },
      error: (err) => {
        console.error('Error cargando pedidos:', err);
        this.loadingPedidos = false;
      }
    });

    // Cargamos productos desde DynamoDB
    this.productService.getProducts().subscribe({
      next: (data: any) => {
        let products: Product[] = [];

        if (Array.isArray(data)) {
          products = data;
        } else if (data?.body) {
          products = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        }

        this.productos = products.map(product => enrichCatalogProduct(product));
        this.loadingProductos = false;
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.loadingProductos = false;
      }
    });
  }

  formatPrice(value: number): string {
    if (value >= 1000000) {
      return '$' + (value / 1000000).toFixed(1) + 'M';
    }
    return '$' + value.toLocaleString('es-CO');
  }

  tiempoRelativo(fecha: string): string {
    if (!fecha) return '';
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'Pendiente',
      'PROCESSING': 'En proceso',
      'COMPLETED': 'Completado',
      'CANCELLED': 'Cancelado'
    };
    return map[status] || status;
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'PENDING': 'yellow',
      'PROCESSING': 'blue',
      'COMPLETED': 'green',
      'CANCELLED': 'red'
    };
    return map[status] || 'yellow';
  }

  onProductImageError(event: Event) {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.includes(this.fallbackImage)) {
      return;
    }

    image.src = this.fallbackImage;
  }

  abrirVistaPrevia(product: CatalogProductView) {
    this.previewProduct = product;
  }

  cerrarVistaPrevia() {
    this.previewProduct = null;
  }

  editarProducto(product: CatalogProductView) {
    void this.router.navigate(['/gestion-productos'], {
      queryParams: { edit: product.id }
    });
  }

  async cerrarSesion() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar tu sesión de Cognito?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sí, cerrar',
          role: 'destructive'
        }
      ]
    });
    await alert.present();

    const { role } = await alert.onDidDismiss();
    if (role === 'destructive') {
      await this.confirmarCerrarSesion();
    }
  }

  private async confirmarCerrarSesion(): Promise<void> {
    await this.authService.logout();

    await this.zone.run(async () => {
      this.sessionProfileService.clearProfile();
      await this.router.navigateByUrl('/inicio', {
        replaceUrl: true
      });
      await new Promise(resolve => setTimeout(resolve, 120));
      await this.navController.navigateRoot('/login-operativo', {
        animated: false
      });
    });
  }
}
