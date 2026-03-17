import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';

export interface ProductPreviewModalData {
  name: string;
  imageUrl: string;
  category?: string | null;
  brand?: string | null;
  presentation?: string | null;
  price?: number | null;
  fallbackImage?: string;
}

@Component({
  selector: 'app-product-preview-modal',
  templateUrl: './product-preview-modal.component.html',
  styleUrls: ['./product-preview-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, CurrencyPipe]
})
export class ProductPreviewModalComponent {
  @Input({ required: true }) product!: ProductPreviewModalData;

  private modalController = inject(ModalController);

  get fallbackImage(): string {
    return this.product?.fallbackImage?.trim() || 'assets/Logos_dpt.png';
  }

  get productImage(): string {
    return this.product?.imageUrl?.trim() || this.fallbackImage;
  }

  get metaLine(): string {
    return [this.product?.presentation, this.product?.category].filter(Boolean).join(' · ');
  }

  dismiss(): Promise<boolean> {
    return this.modalController.dismiss();
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.includes(this.fallbackImage)) {
      return;
    }

    image.src = this.fallbackImage;
  }
}
