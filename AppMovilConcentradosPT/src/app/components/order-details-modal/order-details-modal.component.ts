import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Order, OrderStatus } from '../../models/order.model';
import { getOrderDisplayName, getOrderDisplayPhone, getOrderLocation } from '../../utils/order-contact.util';

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe]
})
export class OrderDetailsModalComponent {
  @Input({ required: true }) order!: Order;

  private modalController = inject(ModalController);

  get customerName(): string {
    return getOrderDisplayName(this.order);
  }

  get customerPhone(): string {
    return getOrderDisplayPhone(this.order) || 'No registrado';
  }

  get customerLocation(): string {
    return getOrderLocation(this.order) || 'No registrada';
  }

  get observations(): string {
    return this.order.observations?.trim() || 'Sin observaciones';
  }

  get statusLabel(): string {
    return this.getStatusLabel(this.order.status);
  }

  dismiss(): Promise<boolean> {
    return this.modalController.dismiss();
  }

  trackByItem(index: number): string {
    return `${index}`;
  }

  private getStatusLabel(status: OrderStatus): string {
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
}
