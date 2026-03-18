import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { OrderStatus } from '../../models/order.model';
import { CustomerOrderView } from '../../models/customer-order.model';
import { OrderDetailsModalComponent } from '../../components/order-details-modal/order-details-modal.component';
import { CustomerOrdersService } from '../../services/customer-orders.service';
import { CustomerReorderService } from '../../services/customer-reorder.service';
import { AppToastService } from '../../services/app-toast.service';

type OrderFilter = OrderStatus | 'TODOS';

@Component({
  selector: 'app-mis-pedidos',
  templateUrl: './mis-pedidos.page.html',
  styleUrls: ['./mis-pedidos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, OrderDetailsModalComponent]
})
export class MisPedidosPage implements OnInit {
  private customerOrdersService = inject(CustomerOrdersService);
  private customerReorderService = inject(CustomerReorderService);
  private appToastService = inject(AppToastService);
  private router = inject(Router);

  loading = true;
  error: string | null = null;
  orders: CustomerOrderView[] = [];
  selectedOrder: CustomerOrderView | null = null;
  isDetailsModalOpen = false;
  yearFilter = 'TODOS';
  statusFilter: OrderFilter = 'TODOS';

  ngOnInit(): void {
    this.loadOrders();
  }

  get yearOptions(): string[] {
    const years = new Set(
      this.orders.map(order => new Date(order.createdAt).getFullYear().toString())
    );

    return ['TODOS', ...[...years].sort((left, right) => Number(right) - Number(left))];
  }

  get filteredOrders(): CustomerOrderView[] {
    return this.orders.filter(order => {
      const orderYear = new Date(order.createdAt).getFullYear().toString();
      const matchesYear = this.yearFilter === 'TODOS' || orderYear === this.yearFilter;
      const matchesStatus = this.statusFilter === 'TODOS' || order.status === this.statusFilter;
      return matchesYear && matchesStatus;
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    this.customerOrdersService.listOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.loading = false;
      },
      error: (error: Error) => {
        this.error = error.message || 'No fue posible cargar tu historial.';
        this.loading = false;
      }
    });
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'PROCESSING':
        return 'En camino';
      case 'COMPLETED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return 'Recibido';
    }
  }

  getStatusClass(status: OrderStatus): string {
    switch (status) {
      case 'PROCESSING':
        return 'status-processing';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  }

  async reorder(order: CustomerOrderView): Promise<void> {
    const result = await this.customerReorderService.reorder(order);

    if (result.addedCount === 0) {
      await this.appToastService.show('Ninguno de los productos de ese pedido sigue disponible.', 'warning');
      return;
    }

    if (result.missingCount > 0) {
      await this.appToastService.show(
        `Se agregaron ${result.addedCount} productos. ${result.missingCount} ya no están disponibles.`,
        'warning'
      );
    } else {
      await this.appToastService.show(`Se agregaron ${result.addedCount} productos al carrito.`, 'success');
    }

    await this.router.navigateByUrl('/mi-pedido');
  }

  async viewDetails(order: CustomerOrderView): Promise<void> {
    try {
      const detailedOrder = await firstValueFrom(this.customerOrdersService.getOrderById(order.id));
      this.selectedOrder = detailedOrder || order;
    } catch {
      this.selectedOrder = order;
      await this.appToastService.show('No fue posible ampliar el pedido. Se mostrará la información disponible.', 'warning');
    }

    this.isDetailsModalOpen = true;
  }

  closeDetails(): void {
    this.isDetailsModalOpen = false;
    this.selectedOrder = null;
  }

  trackByOrder(_index: number, order: CustomerOrderView): string {
    return order.id;
  }
}
