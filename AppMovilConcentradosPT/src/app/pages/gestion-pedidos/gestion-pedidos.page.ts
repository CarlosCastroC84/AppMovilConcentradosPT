import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Order, OrderStatus } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

type DateFilter = 'TODOS' | 'HOY' | 'SEMANA' | 'MES';

@Component({
  selector: 'app-gestion-pedidos',
  templateUrl: './gestion-pedidos.page.html',
  styleUrls: ['./gestion-pedidos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class GestionPedidosPage implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  readonly statusOptions: Array<{ value: OrderStatus; label: string }> = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'PROCESSING', label: 'En proceso' },
    { value: 'COMPLETED', label: 'Completado' },
    { value: 'CANCELLED', label: 'Cancelado' }
  ];

  currentUserInitials = 'PT';
  orders: Order[] = [];
  loading = true;
  error: string | null = null;
  searchTerm = '';
  statusFilter: OrderStatus | 'TODOS' = 'TODOS';
  dateFilter: DateFilter = 'TODOS';
  updatingOrderId: string | null = null;
  deletingOrderId: string | null = null;

  async ngOnInit() {
    await this.loadCurrentUser();
    this.cargarPedidos();
  }

  get filteredOrders(): Order[] {
    const searchTerm = this.searchTerm.trim().toLowerCase();

    return [...this.orders]
      .filter(order => this.matchesStatus(order))
      .filter(order => this.matchesDate(order))
      .filter(order => this.matchesSearch(order, searchTerm))
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }

  get pendingOrders(): number {
    return this.orders.filter(order => order.status === 'PENDING').length;
  }

  get salesToday(): number {
    return this.orders
      .filter(order => this.isSameDay(order.createdAt, new Date()))
      .reduce((total, order) => total + (order.total || 0), 0);
  }

  cargarPedidos() {
    this.loading = true;
    this.error = null;

    this.orderService.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.loading = false;
      },
      error: (error: Error) => {
        this.error = error.message || 'No fue posible cargar los pedidos.';
        this.loading = false;
      }
    });
  }

  resetFilters() {
    this.searchTerm = '';
    this.statusFilter = 'TODOS';
    this.dateFilter = 'TODOS';
  }

  onStatusChange(order: Order, nextStatus: OrderStatus | string) {
    if (!this.isOrderStatus(nextStatus) || nextStatus === order.status) {
      return;
    }

    this.updatingOrderId = order.id;
    const updatedOrder: Order = {
      ...order,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    };

    this.orderService.updateOrder(updatedOrder).subscribe({
      next: savedOrder => {
        this.upsertOrder(savedOrder);
        this.updatingOrderId = null;
        this.showToast(`Pedido ${order.id} actualizado a ${this.getStatusLabel(nextStatus)}.`, 'success');
      },
      error: (error: Error) => {
        this.updatingOrderId = null;
        this.showToast(error.message || 'No fue posible actualizar el pedido.', 'danger');
      }
    });
  }

  async viewOrderDetails(order: Order) {
    const items = order.items.map(item =>
      `${item.quantity} x ${this.escapeHtml(item.name)} (${this.escapeHtml(item.presentation)})`
    ).join('<br/>');

    const alert = await this.alertController.create({
      header: `Pedido ${order.id}`,
      subHeader: this.getCustomerDisplayName(order),
      message: [
        `<strong>Teléfono:</strong> ${this.escapeHtml(this.getCustomerPhone(order) || 'No registrado')}`,
        `<strong>Ubicación:</strong> ${this.escapeHtml(this.getCustomerLocation(order) || 'No registrada')}`,
        `<strong>Total:</strong> ${this.escapeHtml(this.formatPrice(order.total || 0))}`,
        `<strong>Observaciones:</strong> ${this.escapeHtml(order.observations || 'Sin observaciones')}`,
        `<strong>Items:</strong><br/>${items || 'Sin items'}`
      ].join('<br/><br/>'),
      buttons: ['Cerrar']
    });

    await alert.present();
  }

  async confirmDelete(order: Order) {
    const alert = await this.alertController.create({
      header: 'Eliminar pedido',
      message: `Se eliminará el pedido ${order.id} del historial visible en la app.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteOrder(order)
        }
      ]
    });

    await alert.present();
  }

  openWhatsApp(order: Order) {
    const phone = this.getCustomerPhone(order);
    if (!phone) {
      this.showToast('Este pedido no tiene un celular válido para WhatsApp.', 'warning');
      return;
    }

    const message = encodeURIComponent(
      `Hola ${this.getCustomerDisplayName(order)}, tu pedido ${order.id} está en estado ${this.getStatusLabel(order.status)}.`
    );

    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener');
    }
  }

  getStatusLabel(status: OrderStatus): string {
    const option = this.statusOptions.find(item => item.value === status);
    return option?.label || status;
  }

  getStatusTone(status: OrderStatus): string {
    switch (status) {
      case 'PENDING':
        return 'yellow';
      case 'PROCESSING':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'gray';
      default:
        return 'yellow';
    }
  }

  getOrderCardClass(order: Order): Record<string, boolean> {
    const tone = this.getStatusTone(order.status);
    return {
      'border-yellow': tone === 'yellow',
      'border-blue': tone === 'blue',
      'border-green': tone === 'green',
      'border-gray': tone === 'gray',
      dispatched: order.status === 'COMPLETED'
    };
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

  getItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  formatPrice(value: number): string {
    return `$${value.toLocaleString('es-CO')}`;
  }

  trackByOrder(_index: number, order: Order): string {
    return order.id;
  }

  private async loadCurrentUser() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.currentUserInitials = this.buildInitials(user.name || user.username);
    }
  }

  private deleteOrder(order: Order) {
    this.deletingOrderId = order.id;

    this.orderService.deleteOrder(order.id).subscribe({
      next: () => {
        this.orders = this.orders.filter(item => item.id !== order.id);
        this.deletingOrderId = null;
        this.showToast(`Pedido ${order.id} eliminado.`, 'success');
      },
      error: (error: Error) => {
        this.deletingOrderId = null;
        this.showToast(error.message || 'No fue posible eliminar el pedido.', 'danger');
      }
    });
  }

  private matchesSearch(order: Order, searchTerm: string): boolean {
    if (!searchTerm) {
      return true;
    }

    const searchableText = [
      order.id,
      this.getCustomerDisplayName(order),
      this.getCustomerPhone(order) || '',
      this.getCustomerLocation(order) || '',
      order.customerEmail || ''
    ].join(' ').toLowerCase();

    return searchableText.includes(searchTerm);
  }

  private matchesStatus(order: Order): boolean {
    return this.statusFilter === 'TODOS' || order.status === this.statusFilter;
  }

  private matchesDate(order: Order): boolean {
    if (this.dateFilter === 'TODOS') {
      return true;
    }

    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - orderDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    switch (this.dateFilter) {
      case 'HOY':
        return this.isSameDay(order.createdAt, now);
      case 'SEMANA':
        return diffInDays <= 7;
      case 'MES':
        return diffInDays <= 30;
      default:
        return true;
    }
  }

  private isSameDay(dateValue: string, referenceDate: Date): boolean {
    const date = new Date(dateValue);
    return date.toDateString() === referenceDate.toDateString();
  }

  private isOrderStatus(value: string): value is OrderStatus {
    return this.statusOptions.some(option => option.value === value);
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

  private upsertOrder(order: Order) {
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

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2500,
      position: 'top'
    });

    await toast.present();
  }
}
