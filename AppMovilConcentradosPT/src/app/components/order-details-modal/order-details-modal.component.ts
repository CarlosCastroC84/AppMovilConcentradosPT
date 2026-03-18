import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Order, OrderStatus } from '../../models/order.model';
import { CustomerOrderItem, CustomerOrderView } from '../../models/customer-order.model';
import { getOrderDisplayName, getOrderDisplayPhone, getOrderLocation } from '../../utils/order-contact.util';

export type StaffOrderDetailsContext = 'customer' | 'sales' | 'operations';

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe]
})
export class OrderDetailsModalComponent {
  @Input({ required: true }) order!: Order;
  @Input() context: StaffOrderDetailsContext = 'customer';
  @Input() showPrimaryAction = false;
  @Input() primaryActionLabel = '';
  @Input() primaryActionDisabled = false;
  @Input() primaryActionLoading = false;
  @Input() showCancelAction = false;
  @Input() cancelActionDisabled = false;
  @Input() showReturnToSalesAction = false;
  @Input() returnToSalesDisabled = false;
  @Output() closeRequested = new EventEmitter<void>();
  @Output() primaryAction = new EventEmitter<void>();
  @Output() cancelAction = new EventEmitter<void>();
  @Output() returnToSalesAction = new EventEmitter<void>();

  private modalController = inject(ModalController);

  get customerName(): string {
    return getOrderDisplayName(this.order);
  }

  get orderIdentifier(): string {
    return String(this.order.id).startsWith('#')
      ? String(this.order.id)
      : `#${this.order.id}`;
  }

  get customerPhone(): string {
    return getOrderDisplayPhone(this.order) || 'No registrado';
  }

  get customerEmail(): string {
    return this.order.customerEmail?.trim() || 'No registrado';
  }

  get customerLocation(): string {
    return getOrderLocation(this.order) || 'No registrada';
  }

  get deliveryReference(): string {
    const customerOrder = this.customerOrder;
    return customerOrder?.deliverySnapshot.addressReference?.trim() || 'Sin referencia adicional';
  }

  get observations(): string {
    return this.order.observations?.trim() || 'Sin observaciones';
  }

  get statusLabel(): string {
    return this.getStatusLabel(this.order.status);
  }

  get statusClass(): string {
    switch (this.order.status) {
      case 'PROCESSING':
        return 'is-processing';
      case 'COMPLETED':
        return 'is-completed';
      case 'CANCELLED':
        return 'is-cancelled';
      default:
        return 'is-pending';
    }
  }

  get productsCountLabel(): string {
    const count = this.order.items.length;
    return `${count} ${count === 1 ? 'producto' : 'productos'}`;
  }

  get totalUnitsLabel(): string {
    const units = this.order.items.reduce((total, item) => total + item.quantity, 0);
    return `${units} ${units === 1 ? 'unidad' : 'unidades'}`;
  }

  get progressWidth(): string {
    switch (this.order.status) {
      case 'PROCESSING':
        return '68%';
      case 'COMPLETED':
      case 'CANCELLED':
        return '100%';
      default:
        return '32%';
    }
  }

  get timelineLabel(): string {
    switch (this.order.status) {
      case 'PROCESSING':
        return 'En preparación y camino';
      case 'COMPLETED':
        return 'Pedido entregado';
      case 'CANCELLED':
        return 'Pedido cancelado';
      default:
        return 'Pedido recibido';
    }
  }

  get customerOrder(): CustomerOrderView | null {
    if (this.order && typeof this.order === 'object' && 'deliverySnapshot' in this.order) {
      return this.order as CustomerOrderView;
    }

    return null;
  }

  get isSalesContext(): boolean {
    return this.context === 'sales';
  }

  get isOperationsContext(): boolean {
    return this.context === 'operations';
  }

  get hasActionsFooter(): boolean {
    return this.showPrimaryAction || this.showCancelAction || this.showReturnToSalesAction;
  }

  get primaryButtonLabel(): string {
    if (this.primaryActionLoading) {
      return 'Guardando...';
    }

    return this.primaryActionLabel || 'Confirmar';
  }

  async dismiss(): Promise<void> {
    this.closeRequested.emit();

    try {
      await this.modalController.dismiss();
    } catch {
      // When the component is rendered inside a declarative ion-modal, the parent closes it.
    }
  }

  trackByItem(index: number, item: CustomerOrderItem): string {
    return `${item.productId || item.id || index}-${item.presentation}`;
  }

  getItemSubtotal(item: CustomerOrderItem): number {
    return item.price * item.quantity;
  }

  onPrimaryAction(): void {
    if (!this.primaryActionDisabled && !this.primaryActionLoading) {
      this.primaryAction.emit();
    }
  }

  onCancelAction(): void {
    if (!this.cancelActionDisabled) {
      this.cancelAction.emit();
    }
  }

  onReturnToSalesAction(): void {
    if (!this.returnToSalesDisabled) {
      this.returnToSalesAction.emit();
    }
  }

  private getStatusLabel(status: OrderStatus): string {
    const isCustomerOrder = this.order && typeof this.order === 'object' && 'deliverySnapshot' in this.order;

    switch (status) {
      case 'PENDING':
        return isCustomerOrder ? 'Recibido' : 'Pendiente';
      case 'PROCESSING':
        return isCustomerOrder ? 'En camino' : 'En proceso';
      case 'COMPLETED':
        return isCustomerOrder ? 'Entregado' : 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  }
}
