import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { BusinessConfig, BusinessConfigService } from '../../services/business-config.service';

@Component({
  selector: 'app-atencion-cliente',
  templateUrl: './atencion-cliente.page.html',
  styleUrls: ['./atencion-cliente.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class AtencionClientePage implements OnInit {
  private toastController = inject(ToastController);
  private businessConfigService = inject(BusinessConfigService);

  businessConfig: BusinessConfig = this.businessConfigService.getDefaultConfig();

  showModal = false;

  requestForm = {
    name: '',
    phone: '',
    type: 'Pedido',
    message: ''
  };

  async ngOnInit(): Promise<void> {
    this.businessConfig = await this.businessConfigService.loadConfig();
  }

  get weekdayHoursLabel(): string {
    return this.businessConfigService.formatHours(
      this.businessConfig.weekdayOpen,
      this.businessConfig.weekdayClose
    );
  }

  get saturdayHoursLabel(): string {
    return this.businessConfigService.formatHours(
      this.businessConfig.saturdayOpen,
      this.businessConfig.saturdayClose
    );
  }

  get sundayHoursLabel(): string {
    return this.businessConfigService.formatHours(
      this.businessConfig.sundayOpen,
      this.businessConfig.sundayClose
    );
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  openRequestFor(type: string) {
    this.requestForm.type = type;
    this.showModal = true;
  }

  openWhatsAppChannel() {
    const whatsappNumber = this.getWhatsAppNumber();
    if (!whatsappNumber) {
      return;
    }

    const message = 'Hola, necesito información sobre productos, pedidos o cotizaciones.';
    this.openExternal(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    );
  }

  callSupport() {
    const phoneNumber =
      this.businessConfig.phoneNumber.trim() || this.businessConfig.whatsappNumber.trim();

    if (!phoneNumber) {
      void this.showToast('Configura un teléfono de contacto en el panel admin.', 'warning');
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    window.location.href = `tel:${phoneNumber}`;
  }

  async submitRequest() {
    const whatsappNumber = this.getWhatsAppNumber();
    if (!whatsappNumber) {
      return;
    }

    const name = this.requestForm.name.trim();
    const phone = this.requestForm.phone.trim();
    const type = this.requestForm.type.trim();
    const message = this.requestForm.message.trim();

    if (!name || !phone) {
      await this.showToast('Ingresa nombre y teléfono para enviar la solicitud.', 'warning');
      return;
    }

    if (!this.isValidPhone(phone)) {
      await this.showToast('Ingresa un teléfono válido con al menos 10 dígitos.', 'warning');
      return;
    }

    const whatsappMessage = [
      'Hola, quiero crear una nueva solicitud.',
      '',
      `Nombre: ${name}`,
      `Teléfono: ${phone}`,
      `Tipo: ${type}`,
      `Mensaje: ${message || 'Sin mensaje adicional'}`
    ].join('\n');

    this.openExternal(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
    );

    this.showModal = false;
    this.resetForm();
    await this.showToast('Redirigiendo a WhatsApp...', 'success');
  }

  private getWhatsAppNumber(): string | null {
    const whatsappNumber = this.businessConfigService.normalizePhone(this.businessConfig.whatsappNumber);

    if (!whatsappNumber) {
      void this.showToast('Configura primero el WhatsApp del negocio en el panel admin.', 'warning');
      return null;
    }

    return whatsappNumber;
  }

  private openExternal(url: string) {
    if (typeof window === 'undefined') {
      return;
    }

    window.open(url, '_blank', 'noopener');
  }

  private isValidPhone(phone: string): boolean {
    return phone.replace(/\D/g, '').length >= 10;
  }

  private resetForm() {
    this.requestForm = {
      name: '',
      phone: '',
      type: 'Pedido',
      message: ''
    };
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2200,
      position: 'top'
    });

    await toast.present();
  }
}
