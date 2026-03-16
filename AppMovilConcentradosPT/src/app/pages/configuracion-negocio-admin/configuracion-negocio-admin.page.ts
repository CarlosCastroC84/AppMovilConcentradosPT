import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import {
  BusinessConfig,
  BusinessConfigService,
  CoverageArea
} from '../../services/business-config.service';

@Component({
  selector: 'app-configuracion-negocio-admin',
  templateUrl: './configuracion-negocio-admin.page.html',
  styleUrls: ['./configuracion-negocio-admin.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ConfiguracionNegocioAdminPage implements OnInit {
  private businessConfigService = inject(BusinessConfigService);
  private toastController = inject(ToastController);

  form: BusinessConfig = this.businessConfigService.getDefaultConfig();

  newCoverageArea: CoverageArea = {
    name: '',
    detail: ''
  };

  async ngOnInit(): Promise<void> {
    this.form = await this.businessConfigService.loadConfig();
  }

  async saveConfig(): Promise<void> {
    const businessName = this.form.businessName.trim();
    const whatsappNumber = this.form.whatsappNumber.trim();

    if (!businessName || !whatsappNumber) {
      await this.showToast('Ingresa nombre del negocio y número de WhatsApp.', 'warning');
      return;
    }

    if (!this.businessConfigService.isValidPhone(whatsappNumber)) {
      await this.showToast('Ingresa un número de WhatsApp válido con al menos 10 dígitos.', 'warning');
      return;
    }

    this.form = {
      ...this.form,
      businessName,
      businessSubtitle: this.form.businessSubtitle.trim(),
      whatsappNumber,
      phoneNumber: this.form.phoneNumber.trim(),
      coverageAreas: this.form.coverageAreas
        .map(area => ({
          name: area.name.trim(),
          detail: area.detail.trim()
        }))
        .filter(area => area.name.length > 0),
      welcomeTemplate: this.form.welcomeTemplate.trim(),
      confirmationTemplate: this.form.confirmationTemplate.trim()
    };

    await this.businessConfigService.saveConfig(this.form);
    await this.showToast('Configuración guardada correctamente.', 'success');
  }

  async resetConfig(): Promise<void> {
    this.form = this.businessConfigService.getDefaultConfig();
    this.newCoverageArea = { name: '', detail: '' };
    await this.businessConfigService.resetConfig();
    await this.showToast('Configuración restaurada a valores por defecto.', 'medium');
  }

  async previewWelcomeTemplate(): Promise<void> {
    const number = this.businessConfigService.normalizePhone(this.form.whatsappNumber);
    const message = this.form.welcomeTemplate.trim();

    if (!number) {
      await this.showToast('Configura primero un número de WhatsApp válido.', 'warning');
      return;
    }

    if (!message) {
      await this.showToast('Escribe primero una plantilla de bienvenida.', 'warning');
      return;
    }

    this.openExternal(`https://wa.me/${number}?text=${encodeURIComponent(message)}`);
  }

  addCoverageArea(): void {
    const name = this.newCoverageArea.name.trim();
    const detail = this.newCoverageArea.detail.trim();

    if (!name) {
      void this.showToast('Ingresa al menos el nombre de la zona.', 'warning');
      return;
    }

    this.form.coverageAreas = [
      ...this.form.coverageAreas,
      { name, detail }
    ];

    this.newCoverageArea = {
      name: '',
      detail: ''
    };
  }

  removeCoverageArea(index: number): void {
    this.form.coverageAreas = this.form.coverageAreas.filter((_, currentIndex) => currentIndex !== index);
  }

  trackByCoverage(index: number): number {
    return index;
  }

  get sundayHoursLabel(): string {
    return this.businessConfigService.formatHours(this.form.sundayOpen, this.form.sundayClose);
  }

  private openExternal(url: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.open(url, '_blank', 'noopener');
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2200,
      position: 'top'
    });

    await toast.present();
  }
}
