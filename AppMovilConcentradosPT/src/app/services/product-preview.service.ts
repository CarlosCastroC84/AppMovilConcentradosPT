import { Injectable, Injector, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import type { ProductPreviewModalData } from '../components/product-preview-modal/product-preview-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ProductPreviewService {
  private injector = inject(Injector);

  async open(product: ProductPreviewModalData): Promise<void> {
    const modalController = this.injector.get(ModalController);
    const { ProductPreviewModalComponent } = await import(
      '../components/product-preview-modal/product-preview-modal.component'
    );

    const modal = await modalController.create({
      component: ProductPreviewModalComponent,
      componentProps: { product },
      cssClass: 'product-preview-modal',
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();
  }
}
