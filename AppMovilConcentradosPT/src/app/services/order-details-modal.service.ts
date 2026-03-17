import { Injectable, Injector, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderDetailsModalService {
  private injector = inject(Injector);

  async open(order: Order): Promise<void> {
    const modalController = this.injector.get(ModalController);
    const { OrderDetailsModalComponent } = await import(
      '../components/order-details-modal/order-details-modal.component'
    );

    const modal = await modalController.create({
      component: OrderDetailsModalComponent,
      componentProps: { order },
      cssClass: 'order-details-modal',
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();
  }
}
