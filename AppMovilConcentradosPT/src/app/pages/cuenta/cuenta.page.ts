import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AppToastService } from '../../services/app-toast.service';
import { AuthService } from '../../services/auth.service';
import { CustomerProfileService } from '../../services/customer-profile.service';

type AccountMode = 'login' | 'register' | 'confirm' | 'forgot';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.page.html',
  styleUrls: ['./cuenta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CuentaPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private customerProfileService = inject(CustomerProfileService);
  private appToastService = inject(AppToastService);

  mode: AccountMode = 'login';
  redirectTo = '/perfil';
  loading = false;
  resetCodeSent = false;

  email = '';
  fullName = '';
  password = '';
  confirmPassword = '';
  confirmationCode = '';
  resetCode = '';
  newPassword = '';

  showPassword = false;
  showConfirmPassword = false;
  showNewPassword = false;

  private pendingSignupPassword = '';

  get canUseGoogle(): boolean {
    return this.authService.hasHostedUiConfigured();
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(async params => {
      this.mode = this.resolveMode(params.get('mode'));
      this.redirectTo = params.get('redirectTo')?.trim() || '/perfil';
      this.email = params.get('email')?.trim().toLowerCase() || this.email;

      const oauthError = params.get('oauthError')?.trim();
      if (oauthError) {
        await this.appToastService.show(oauthError, 'danger');
      }

      if (this.mode === 'login' && await this.authService.isAuthenticated()) {
        await this.finalizeAuthenticatedFlow();
      }
    });
  }

  setMode(mode: AccountMode): void {
    this.mode = mode;
    this.resetCodeSent = false;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  async onLogin(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    const password = this.password;

    if (!email || !password) {
      await this.appToastService.show('Ingresa tu correo y contraseña.', 'warning');
      return;
    }

    this.loading = true;

    try {
      const result = await this.authService.login(email, password);
      if (result.success) {
        await this.finalizeAuthenticatedFlow();
        return;
      }

      await this.appToastService.show('Tu cuenta requiere un paso adicional para iniciar sesión.', 'warning');
    } catch (error: unknown) {
      await this.appToastService.show(this.readAuthError(error), 'danger');
    } finally {
      this.loading = false;
    }
  }

  async onRegister(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    const fullName = this.fullName.trim();
    const password = this.password;
    const confirmPassword = this.confirmPassword;

    if (!email || !fullName || !password || !confirmPassword) {
      await this.appToastService.show('Completa nombre, correo y contraseña.', 'warning');
      return;
    }

    if (!this.isValidEmail(email)) {
      await this.appToastService.show('Ingresa un correo válido.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      await this.appToastService.show('Las contraseñas no coinciden.', 'warning');
      return;
    }

    if (password.length < 8) {
      await this.appToastService.show('La contraseña debe tener al menos 8 caracteres.', 'warning');
      return;
    }

    this.loading = true;

    try {
      const result = await this.authService.signUpCustomer(email, password, fullName);
      this.pendingSignupPassword = password;

      if ((result.nextStep as { signUpStep?: string } | undefined)?.signUpStep === 'DONE') {
        await this.authService.login(email, password);
        await this.finalizeAuthenticatedFlow();
        return;
      }

      this.mode = 'confirm';
      await this.appToastService.show('Te enviamos un código para confirmar tu cuenta.', 'success');
    } catch (error: unknown) {
      await this.appToastService.show(this.readAuthError(error), 'danger');
    } finally {
      this.loading = false;
    }
  }

  async onConfirmSignUp(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    const confirmationCode = this.confirmationCode.trim();

    if (!email || !confirmationCode) {
      await this.appToastService.show('Ingresa el correo y el código de verificación.', 'warning');
      return;
    }

    this.loading = true;

    try {
      await this.authService.confirmCustomerSignUp(email, confirmationCode);

      if (this.pendingSignupPassword) {
        await this.authService.login(email, this.pendingSignupPassword);
        await this.finalizeAuthenticatedFlow();
        return;
      }

      this.mode = 'login';
      await this.appToastService.show('Cuenta confirmada. Ahora puedes iniciar sesión.', 'success');
    } catch (error: unknown) {
      await this.appToastService.show(this.readAuthError(error), 'danger');
    } finally {
      this.loading = false;
    }
  }

  async resendCode(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    if (!email) {
      await this.appToastService.show('Ingresa tu correo primero.', 'warning');
      return;
    }

    try {
      await this.authService.resendCustomerSignUpCode(email);
      await this.appToastService.show('Te reenviamos el código de confirmación.', 'success');
    } catch (error: unknown) {
      await this.appToastService.show(this.readAuthError(error), 'danger');
    }
  }

  async onRequestPasswordReset(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    if (!this.isValidEmail(email)) {
      await this.appToastService.show('Ingresa un correo válido.', 'warning');
      return;
    }

    this.loading = true;

    try {
      await this.authService.forgotPassword(email);
      this.resetCodeSent = true;
      await this.appToastService.show('Revisa tu correo para continuar con la recuperación.', 'success');
    } catch (error: unknown) {
      await this.appToastService.show(this.readAuthError(error), 'danger');
    } finally {
      this.loading = false;
    }
  }

  async onConfirmPasswordReset(): Promise<void> {
    const email = this.email.trim().toLowerCase();
    const resetCode = this.resetCode.trim();
    const newPassword = this.newPassword;

    if (!email || !resetCode || !newPassword) {
      await this.appToastService.show('Completa correo, código y nueva contraseña.', 'warning');
      return;
    }

    if (newPassword.length < 8) {
      await this.appToastService.show('La nueva contraseña debe tener al menos 8 caracteres.', 'warning');
      return;
    }

    this.loading = true;

    try {
      await this.authService.confirmForgotPassword(email, resetCode, newPassword);
      this.mode = 'login';
      this.resetCodeSent = false;
      this.password = '';
      this.confirmPassword = '';
      this.newPassword = '';
      this.resetCode = '';
      await this.appToastService.show('Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
    } catch (error: unknown) {
      await this.appToastService.show(this.readAuthError(error), 'danger');
    } finally {
      this.loading = false;
    }
  }

  async continueWithGoogle(): Promise<void> {
    this.loading = true;

    try {
      await this.authService.signInWithGoogle(this.redirectTo);
    } catch (error: unknown) {
      this.loading = false;
      await this.appToastService.show(this.readAuthError(error), 'danger');
    }
  }

  private async finalizeAuthenticatedFlow(): Promise<void> {
    const profile = await firstValueFrom(this.customerProfileService.bootstrapProfile());
    const needsCompletion = !this.customerProfileService.isProfileComplete(profile);

    await this.router.navigateByUrl(
      needsCompletion && this.redirectTo === '/mi-pedido'
        ? `/perfil?complete=1&redirectTo=${encodeURIComponent(this.redirectTo)}`
        : this.redirectTo,
      { replaceUrl: true }
    );
  }

  private resolveMode(value: string | null): AccountMode {
    switch (value) {
      case 'register':
      case 'confirm':
      case 'forgot':
        return value;
      default:
        return 'login';
    }
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private readAuthError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'No fue posible completar el proceso de autenticación.';
    }

    const knownErrors: Record<string, string> = {
      NotAuthorizedException: 'Correo o contraseña incorrectos.',
      UserNotFoundException: 'No encontramos una cuenta con ese correo.',
      UsernameExistsException: 'Ese correo ya está registrado.',
      CodeMismatchException: 'El código ingresado no es válido.',
      ExpiredCodeException: 'El código expiró. Solicita uno nuevo.',
      LimitExceededException: 'Has intentado demasiadas veces. Espera un momento.',
      InvalidPasswordException: 'La contraseña no cumple la política mínima de seguridad.',
      UserAlreadyAuthenticatedException: 'Ya existe una sesión activa en este dispositivo.'
    };

    return knownErrors[error.name] || error.message || 'No fue posible completar el proceso de autenticación.';
  }
}
