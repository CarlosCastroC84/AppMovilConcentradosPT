import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-ventas',
  templateUrl: './dashboard-ventas.page.html',
  styleUrls: ['./dashboard-ventas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DashboardVentasPage implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  currentUser = 'Operaciones';
  currentUserInitials = 'PT';

  orders: Order[] = [];
  loading = true;
  error: string | null = null;
  updatingOrderId: string | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadCurrentUser();
    this.cargarPedidos();
  }

  get recentOrders(): Order[] {
    return [...this.orders]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 5);
  }

  get ordersTodayCount(): number {
    return this.orders.filter(order => this.isSameDay(order.createdAt, new Date())).length;
  }

  get pendingOrdersCount(): number {
    return this.orders.filter(order => order.status === 'PENDING').length;
  }

  get processingOrdersCount(): number {
    return this.orders.filter(order => order.status === 'PROCESSING').length;
  }

  get salesToday(): number {
    return this.orders
      .filter(order => this.isSameDay(order.createdAt, new Date()))
      .filter(order => order.status !== 'CANCELLED')
      .reduce((total, order) => total + (order.total || 0), 0);
  }

  get ordersDeltaVsYesterday(): number {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayCount = this.orders.filter(order => this.isSameDay(order.createdAt, today)).length;
    const yesterdayCount = this.orders.filter(order => this.isSameDay(order.createdAt, yesterday)).length;

    return todayCount - yesterdayCount;
  }

  get ordersDeltaLabel(): string {
    const delta = this.ordersDeltaVsYesterday;

    if (delta > 0) {
      return `+${delta} vs ayer`;
    }

    if (delta < 0) {
      return `${delta} vs ayer`;
    }

    return 'Sin cambio vs ayer';
  }

  cargarPedidos(): void {
    this.loading = true;
    this.error = null;

    this.orderService.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.loading = false;
      },
      error: (error: Error) => {
        this.error = error.message || 'No fue posible cargar las ventas.';
        this.loading = false;
      }
    });
  }

  async viewOrderDetails(order: Order): Promise<void> {
    const items = order.items.map(item =>
      `${item.quantity} x ${this.escapeHtml(item.name)} (${this.escapeHtml(item.presentation)})`
    ).join('<br/>');

    const alert = await this.alertController.create({
      header: `Pedido ${order.id}`,
      subHeader: this.getCustomerDisplayName(order),
      message: [
        `<strong>Estado:</strong> ${this.escapeHtml(this.getStatusLabel(order.status))}`,
        `<strong>Total:</strong> ${this.escapeHtml(this.formatPrice(order.total || 0))}`,
        `<strong>Teléfono:</strong> ${this.escapeHtml(this.getCustomerPhone(order) || 'No registrado')}`,
        `<strong>Ubicación:</strong> ${this.escapeHtml(this.getCustomerLocation(order) || 'No registrada')}`,
        `<strong>Items:</strong><br/>${items || 'Sin items'}`
      ].join('<br/><br/>'),
      buttons: ['Cerrar']
    });

    await alert.present();
  }

  confirmOrder(order: Order): void {
    if (order.status !== 'PENDING') {
      void this.showToast('Este pedido ya no está pendiente de confirmación.', 'warning');
      return;
    }

    this.updatingOrderId = order.id;

    const updatedOrder: Order = {
      ...order,
      status: 'PROCESSING',
      updatedAt: new Date().toISOString()
    };

    this.orderService.updateOrder(updatedOrder).subscribe({
      next: savedOrder => {
        this.upsertOrder(savedOrder);
        this.updatingOrderId = null;
        void this.showToast(`Pedido ${order.id} confirmado.`, 'success');
      },
      error: (error: Error) => {
        this.updatingOrderId = null;
        void this.showToast(error.message || 'No fue posible confirmar el pedido.', 'danger');
      }
    });
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'PROCESSING':
        return 'En proceso';
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getStatusTone(status: OrderStatus): string {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'PROCESSING':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'gray';
      default:
        return 'orange';
    }
  }

  getCustomerDisplayName(order: Order): string {
    if (order.customerName?.trim()) {
      return this.parseLegacyCustomerName(order.customerName).name;
    }

    return 'Cliente sin nombre';
  }

  getCustomerPhone(order: Order): string | null {
    const rawPhone = order.customerPhone || this.parseLegacyCustomerName(order.customerName).phone;
    if (!rawPhone) {
      return null;
    }

    const digits = rawPhone.replace(/\D/g, '');
    if (!digits) {
      return null;
    }

    return digits.length === 10 ? `57${digits}` : digits;
  }

  getCustomerLocation(order: Order): string | null {
    return order.customerLocation || this.parseLegacyCustomerName(order.customerName).location || null;
  }

  getItemSummary(order: Order): string {
    const firstItem = order.items[0];

    if (!firstItem) {
      return 'Sin productos';
    }

    const totalItems = this.getItemCount(order);

    if (order.items.length === 1) {
      return `${totalItems} ${totalItems === 1 ? 'unidad' : 'unidades'} - ${firstItem.name}`;
    }

    return `${totalItems} items - ${firstItem.name} y ${order.items.length - 1} más`;
  }

  getItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  formatPrice(value: number): string {
    return `$${value.toLocaleString('es-CO')}`;
  }

  tiempoRelativo(dateValue: string): string {
    const now = Date.now();
    const then = new Date(dateValue).getTime();
    const diffInMinutes = Math.max(1, Math.floor((now - then) / 60000));

    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      const remainingMinutes = diffInMinutes % 60;
      return remainingMinutes > 0
        ? `Hace ${diffInHours}h ${remainingMinutes}m`
        : `Hace ${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays === 1 ? '' : 's'}`;
  }

  trackByOrder(_index: number, order: Order): string {
    return order.id;
  }

  private async loadCurrentUser(): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) {
      return;
    }

    this.currentUser = user.name || user.username;
    this.currentUserInitials = this.buildInitials(this.currentUser);
  }

  private isSameDay(dateValue: string, referenceDate: Date): boolean {
    const date = new Date(dateValue);
    return date.toDateString() === referenceDate.toDateString();
  }

  private parseLegacyCustomerName(customerName: string): { name: string; phone?: string; location?: string } {
    const trimmedName = customerName.trim();
    const legacyMatch = /^(.*?)\s*-\s*([+\d\s-]+?)(?:\s*\((.*?)\))?$/.exec(trimmedName);

    if (!legacyMatch) {
      return { name: trimmedName };
    }

    const [, name, phone, location] = legacyMatch;
    return {
      name: name.trim(),
      phone: phone?.trim(),
      location: location?.trim()
    };
  }

  private upsertOrder(order: Order): void {
    const index = this.orders.findIndex(item => item.id === order.id);

    if (index >= 0) {
      this.orders = [
        ...this.orders.slice(0, index),
        order,
        ...this.orders.slice(index + 1)
      ];
      return;
    }

    this.orders = [...this.orders, order];
  }

  private buildInitials(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'PT';
    }

    return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2400,
      position: 'top'
    });

    await toast.present();
  }
}
