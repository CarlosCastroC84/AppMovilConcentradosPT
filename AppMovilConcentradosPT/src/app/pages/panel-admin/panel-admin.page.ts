import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-panel-admin',
  templateUrl: './panel-admin.page.html',
  styleUrls: ['./panel-admin.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PanelAdminPage implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private router = inject(Router);

  currentUser: string = 'Administrador';
  pedidos: any[] = [];
  productos: any[] = [];
  loadingPedidos = true;
  loadingProductos = true;

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

  async ngOnInit() {
    // Obtenemos el nombre real del usuario logueado
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user.name || user.email || user.username;
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
        if (Array.isArray(data)) {
          this.productos = data;
        } else if (data?.body) {
          this.productos = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        } else {
          this.productos = [];
        }
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
          role: 'destructive',
          handler: async () => {
            await this.authService.logout();
            const toast = await this.toastController.create({
              message: 'Sesión cerrada exitosamente',
              duration: 2000,
              color: 'medium',
              position: 'top'
            });
            await toast.present();
            this.router.navigate(['/login-operativo']);
          }
        }
      ]
    });
    await alert.present();
  }
}
