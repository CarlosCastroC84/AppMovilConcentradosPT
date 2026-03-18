import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CustomerOrderView } from '../../models/customer-order.model';
import { CustomerProfileService } from '../../services/customer-profile.service';
import { CustomerOrdersService } from '../../services/customer-orders.service';
import { AppToastService } from '../../services/app-toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PerfilPage implements OnInit {
  private customerProfileService = inject(CustomerProfileService);
  private customerOrdersService = inject(CustomerOrdersService);
  private appToastService = inject(AppToastService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = true;
  saving = false;
  isEditingProfile = false;
  requiresCompletion = false;
  redirectTo: string | null = null;

  fullName = '';
  email = '';
  phone = '';
  municipality = '';
  addressReference = '';
  avatarUrl = '';
  authProvider: 'COGNITO' | 'GOOGLE' = 'COGNITO';

  latestOrder: CustomerOrderView | null = null;
  private persistedProfile: {
    fullName: string;
    email: string;
    phone: string;
    municipality: string;
    addressReference?: string;
    authProvider: 'COGNITO' | 'GOOGLE';
  } | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.requiresCompletion = params.get('complete') === '1';
      this.redirectTo = params.get('redirectTo');
    });

    void this.loadData();
  }

  get greetingName(): string | null {
    const normalizedFullName = this.normalizeGreetingCandidate(this.fullName);
    if (normalizedFullName) {
      return normalizedFullName.split(/\s+/)[0];
    }

    return null;
  }

  get greetingLine(): string {
    return this.greetingName
      ? `Hola, ${this.greetingName}!`
      : 'Hola!';
  }

  get statusLabel(): string {
    if (!this.latestOrder) {
      return 'Sin pedidos';
    }

    switch (this.latestOrder.status) {
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

  get statusClass(): string {
    if (!this.latestOrder) {
      return 'is-empty';
    }

    switch (this.latestOrder.status) {
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

  get progressWidth(): string {
    if (!this.latestOrder) {
      return '0%';
    }

    switch (this.latestOrder.status) {
      case 'PROCESSING':
        return '68%';
      case 'COMPLETED':
      case 'CANCELLED':
        return '100%';
      default:
        return '32%';
    }
  }

  get latestOrderSummary(): string {
    if (!this.latestOrder) {
      return '';
    }

    const formattedOrderId = String(this.latestOrder.id).startsWith('#')
      ? String(this.latestOrder.id)
      : `#${this.latestOrder.id}`;
    const itemLabel = this.latestOrder.itemCount === 1 ? 'bulto' : 'bultos';

    return `Pedido ${formattedOrderId} - ${this.latestOrder.itemCount} ${itemLabel}`;
  }

  get providerLabel(): string {
    return this.authProvider === 'GOOGLE' ? 'Google' : 'Correo';
  }

  get canToggleEditProfile(): boolean {
    return this.hasPersistedCompleteProfile();
  }

  async saveProfile(): Promise<void> {
    if (!this.fullName.trim() || !this.phone.trim() || !this.municipality.trim()) {
      await this.appToastService.show('Completa nombre, celular y municipio/vereda.', 'warning');
      return;
    }

    this.saving = true;

    this.customerProfileService.updateProfile({
      fullName: this.fullName,
      phone: this.phone,
      municipality: this.municipality,
      addressReference: this.addressReference
    }).subscribe({
      next: async profile => {
        this.syncForm(profile);
        this.saving = false;
        this.isEditingProfile = false;
        await this.appToastService.show('Perfil actualizado correctamente.', 'success');

        if (this.requiresCompletion && this.redirectTo && this.customerProfileService.isProfileComplete(profile)) {
          await this.router.navigateByUrl(this.redirectTo, { replaceUrl: true });
        }
      },
      error: async (error: Error) => {
        this.saving = false;
        await this.appToastService.show(error.message || 'No fue posible actualizar tu perfil.', 'danger');
      }
    });
  }

  openOrders(): void {
    void this.router.navigateByUrl('/mis-pedidos');
  }

  enableProfileEdit(): void {
    this.isEditingProfile = true;
  }

  cancelProfileEdit(): void {
    if (!this.persistedProfile) {
      this.isEditingProfile = false;
      return;
    }

    this.applyProfile(this.persistedProfile);
    this.isEditingProfile = false;
  }

  scrollToProfileForm(): void {
    if (!this.isEditingProfile) {
      this.enableProfileEdit();
    }

    document.getElementById('profile-form-card')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  openHelp(): void {
    void this.router.navigateByUrl('/atencion-cliente');
  }

  openSecurity(): void {
    if (this.authProvider === 'GOOGLE') {
      void this.appToastService.show('Tu acceso depende de Google. Administra la seguridad desde esa cuenta.', 'medium');
      return;
    }

    void this.router.navigate(['/cuenta'], {
      queryParams: {
        mode: 'forgot',
        email: this.email
      }
    });
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.customerProfileService.clearProfile();
    await this.router.navigateByUrl('/inicio', { replaceUrl: true });
  }

  private async loadData(): Promise<void> {
    this.loading = true;

    try {
      const currentUser = await this.authService.getCurrentUser();
      this.avatarUrl = currentUser?.avatarUrl?.trim() || '';

      const profile = await firstValueFrom(this.customerProfileService.bootstrapProfile());
      this.syncForm(profile);
      this.isEditingProfile = !this.customerProfileService.isProfileComplete(profile);
    } finally {
      this.loading = false;
    }

    this.customerOrdersService.listOrders().subscribe({
      next: orders => {
        this.latestOrder = orders[0] || null;
      },
      error: () => {
        this.latestOrder = null;
      }
    });
  }

  private syncForm(profile: {
    fullName: string;
    email: string;
    phone: string;
    municipality: string;
    addressReference?: string;
    authProvider: 'COGNITO' | 'GOOGLE';
  }): void {
    this.persistedProfile = { ...profile };
    this.applyProfile(profile);
  }

  private applyProfile(profile: {
    fullName: string;
    email: string;
    phone: string;
    municipality: string;
    addressReference?: string;
    authProvider: 'COGNITO' | 'GOOGLE';
  }): void {
    this.fullName = profile.fullName;
    this.email = profile.email;
    this.phone = profile.phone;
    this.municipality = profile.municipality;
    this.addressReference = profile.addressReference || '';
    this.authProvider = profile.authProvider;
  }

  private normalizeGreetingCandidate(value: string): string | null {
    const normalizedValue = value.trim();

    if (!normalizedValue || normalizedValue.includes('@')) {
      return null;
    }

    return normalizedValue;
  }

  private hasPersistedCompleteProfile(): boolean {
    if (!this.persistedProfile) {
      return false;
    }

    return [
      this.persistedProfile.fullName,
      this.persistedProfile.phone,
      this.persistedProfile.municipality
    ].every(value => value.trim().length > 0);
  }
}
