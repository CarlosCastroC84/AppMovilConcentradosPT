import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { BusinessConfig, BusinessConfigService } from '../../services/business-config.service';

const WHOLESALE_DRAFT_KEY = 'mayoristas_quote_draft';

interface WholesaleQuoteForm {
  businessName: string;
  contactName: string;
  phone: string;
  line: string;
  volume: string;
  message: string;
}

@Component({
  selector: 'app-mayoristas',
  templateUrl: './mayoristas.page.html',
  styleUrls: ['./mayoristas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class MayoristasPage implements OnInit {
  private toastController = inject(ToastController);
  private storageService = inject(StorageService);
  private businessConfigService = inject(BusinessConfigService);

  businessConfig: BusinessConfig = this.businessConfigService.getDefaultConfig();

  quoteForm: WholesaleQuoteForm = this.createEmptyForm();

  async ngOnInit(): Promise<void> {
    const [businessConfig, draft] = await Promise.all([
      this.businessConfigService.loadConfig(),
      this.storageService.getJson<Partial<WholesaleQuoteForm>>(WHOLESALE_DRAFT_KEY)
    ]);

    this.businessConfig = businessConfig;

    if (draft) {
      this.quoteForm = { ...this.quoteForm, ...draft };
    }
  }

  openGeneralQuote() {
    const whatsappNumber = this.getWhatsAppNumber();
    if (!whatsappNumber) {
      return;
    }

    const message = [
      'Hola, quiero solicitar una cotización mayorista.',
      '',
      'Necesito información sobre precios por volumen y condiciones comerciales.'
    ].join('\n');

    this.openExternal(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    );
  }

  openAdvisorChat() {
    const whatsappNumber = this.getWhatsAppNumber();
    if (!whatsappNumber) {
      return;
    }

    const message = 'Hola, necesito hablar con un asesor comercial para compras mayoristas.';
    this.openExternal(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    );
  }

  async submitQuote() {
    const whatsappNumber = this.getWhatsAppNumber();
    if (!whatsappNumber) {
      return;
    }

    const businessName = this.quoteForm.businessName.trim();
    const contactName = this.quoteForm.contactName.trim();
    const phone = this.quoteForm.phone.trim();
    const line = this.quoteForm.line.trim();
    const volume = this.quoteForm.volume.trim();
    const message = this.quoteForm.message.trim();

    if (!businessName || !contactName || !phone) {
      await this.showToast('Ingresa empresa, contacto y teléfono.', 'warning');
      return;
    }

    if (!this.isValidPhone(phone)) {
      await this.showToast('Ingresa un teléfono válido con al menos 10 dígitos.', 'warning');
      return;
    }

    const whatsappMessage = [
      'Hola, quiero solicitar una cotización mayorista.',
      '',
      `Empresa / Granja: ${businessName}`,
      `Contacto: ${contactName}`,
      `Celular: ${phone}`,
      `Línea de interés: ${line}`,
      `Volumen estimado: ${volume || 'Por confirmar'}`,
      `Mensaje: ${message || 'Sin mensaje adicional'}`
    ].join('\n');

    this.openExternal(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
    );

    await this.storageService.remove(WHOLESALE_DRAFT_KEY);
    this.quoteForm = this.createEmptyForm();
    await this.showToast('Redirigiendo a WhatsApp...', 'success');
  }

  async saveDraft() {
    await this.storageService.setJson(WHOLESALE_DRAFT_KEY, this.quoteForm);
    await this.showToast('Solicitud guardada en este dispositivo.', 'success');
  }

  async clearQuoteForm(showFeedback = true) {
    this.quoteForm = this.createEmptyForm();
    await this.storageService.remove(WHOLESALE_DRAFT_KEY);

    if (showFeedback) {
      await this.showToast('Formulario limpio.', 'medium');
    }
  }

  private createEmptyForm(): WholesaleQuoteForm {
    return {
      businessName: '',
      contactName: '',
      phone: '',
      line: 'Ganadería',
      volume: '',
      message: ''
    };
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
