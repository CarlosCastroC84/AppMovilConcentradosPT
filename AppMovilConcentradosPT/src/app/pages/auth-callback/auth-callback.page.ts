import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CustomerProfileService } from '../../services/customer-profile.service';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.page.html',
  styleUrls: ['./auth-callback.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AuthCallbackPage implements OnInit {
  private authService = inject(AuthService);
  private customerProfileService = inject(CustomerProfileService);
  private router = inject(Router);

  statusMessage = 'Validando tu acceso...';

  async ngOnInit(): Promise<void> {
    const result = await this.authService.handleHostedUiCallback();

    if (!result.success) {
      await this.router.navigate(['/cuenta'], {
        replaceUrl: true,
        queryParams: {
          mode: 'login',
          redirectTo: result.redirectTo || '/perfil',
          oauthError: result.error || 'No fue posible completar el acceso con Google.'
        }
      });
      return;
    }

    const profile = await firstValueFrom(this.customerProfileService.bootstrapProfile());
    const redirectTo = result.redirectTo || '/perfil';
    const needsCompletion = !this.customerProfileService.isProfileComplete(profile);

    this.statusMessage = needsCompletion
      ? 'Tu sesión está lista. Vamos a completar tu perfil.'
      : 'Sesión iniciada. Preparando tu experiencia.';

    await this.router.navigateByUrl(
      needsCompletion
        ? `/perfil?complete=1&redirectTo=${encodeURIComponent(redirectTo)}`
        : redirectTo,
      { replaceUrl: true }
    );
  }
}
