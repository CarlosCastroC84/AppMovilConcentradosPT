import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { confirmSignIn } from 'aws-amplify/auth';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SessionProfileService } from '../../services/session-profile.service';


@Component({
  selector: 'app-login-operativo',
  templateUrl: './login-operativo.page.html',
  styleUrls: ['./login-operativo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]

})
export class LoginOperativoPage {
  private authService = inject(AuthService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sessionProfileService = inject(SessionProfileService);

  // Variables del formulario
  username = '';
  password = '';
  showPassword = false;

  // Flujo de cambio de contraseña obligatorio
  requiresNewPassword = false;
  newPassword = '';
  confirmNewPassword = '';
  showNewPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  async onLogin() {
    if (!this.username || !this.password) {
      this.mostrarMensaje('Por favor ingresa tu usuario y contraseña', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      // Limpiamos cualquier sesión anterior para evitar "There is already a signed in user"
      await this.authService.logout();

      const result = await this.authService.login(this.username, this.password);
      await loading.dismiss();

      if (result.success) {
        await this.loginExitoso();
      } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        // Cognito exige cambiar la contraseña temporal
        this.requiresNewPassword = true;
        this.mostrarMensaje('Debes establecer una nueva contraseña para continuar.', 'warning');
      } else if (result.nextStep) {
        this.mostrarMensaje(`Paso adicional requerido: ${result.nextStep.signInStep}`, 'warning');
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error de login:', error);
      this.mostrarMensajeError(error);
    }
  }

  async onSetNewPassword() {
    if (!this.newPassword || !this.confirmNewPassword) {
      this.mostrarMensaje('Por favor llena ambos campos de contraseña', 'warning');
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.mostrarMensaje('Las contraseñas no coinciden', 'danger');
      return;
    }

    if (this.newPassword.length < 8) {
      this.mostrarMensaje('La contraseña debe tener al menos 8 caracteres', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Estableciendo nueva contraseña...',
      spinner: 'circles'
    });
    await loading.present();

    try {
      // Usamos confirmSignIn de Amplify para completar el reto de nueva contraseña
      const result = await confirmSignIn({ challengeResponse: this.newPassword });
      await loading.dismiss();

      if (result.isSignedIn) {
        this.requiresNewPassword = false;
        await this.loginExitoso();
      } else {
        this.mostrarMensaje('Contraseña actualizada. Intenta iniciar sesión de nuevo.', 'success');
        this.requiresNewPassword = false;
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error cambiando contraseña:', error);
      this.mostrarMensajeError(error);
    }
  }

  private async loginExitoso() {
    const userInfo = await this.authService.getCurrentUser();

    try {
      await firstValueFrom(this.sessionProfileService.loadProfile());
    } catch (error) {
      console.error('No fue posible cargar el perfil de sesión:', error);
      this.mostrarMensaje('No fue posible cargar permisos del usuario.', 'danger');
      return;
    }

    this.mostrarMensaje(`¡Bienvenido ${userInfo?.username || this.username}!`, 'success');

    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
    const fallbackRoute = this.sessionProfileService.getDefaultRoute();

    this.router.navigateByUrl(redirectTo || fallbackRoute);
  }


  private mostrarMensajeError(error: any) {
    let errorMsg = 'Error al iniciar sesión';
    if (error.name === 'NotAuthorizedException') {
      errorMsg = 'Usuario o contraseña incorrectos';
    } else if (error.name === 'UserNotFoundException') {
      errorMsg = 'Usuario no encontrado';
    } else if (error.name === 'UserNotConfirmedException') {
      errorMsg = 'Tu cuenta no ha sido confirmada. Revisa tu email.';
    } else if (error.name === 'InvalidPasswordException') {
      errorMsg = 'La contraseña no cumple los requisitos mínimos de seguridad de Cognito.';
    } else if (error.name === 'NetworkError' || error.message?.includes('Network')) {
      errorMsg = 'Sin conexión a internet';
    } else if (error.message) {
      errorMsg = error.message;
    }
    this.mostrarMensaje(errorMsg, 'danger');
  }

  async mostrarMensaje(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }
}
