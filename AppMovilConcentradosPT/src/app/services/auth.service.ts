import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Amplify } from 'aws-amplify';
import {
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signInWithRedirect,
  signOut,
  signUp
} from 'aws-amplify/auth';
import { AuthProvider } from '../models/customer-profile.model';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';

const CUSTOMER_AUTH_REDIRECT_KEY = 'customer_auth_redirect';

export interface AuthenticatedUser {
  userId: string;
  username: string;
  email: string;
  name: string;
  avatarUrl?: string;
  groups: string[];
  provider: AuthProvider;
}

function getRuntimeOrigin(): string {
  if (typeof window !== 'undefined' && typeof window.location?.origin === 'string' && window.location.origin) {
    return window.location.origin;
  }

  return 'http://localhost:8100';
}

function resolveRedirectUrl(configValue: string | undefined, fallbackPath: string): string {
  const trimmedValue = configValue?.trim();
  if (trimmedValue) {
    return trimmedValue;
  }

  return `${getRuntimeOrigin()}${fallbackPath}`;
}

function buildOAuthConfig():
  | {
      domain: string;
      scopes: string[];
      redirectSignIn: string[];
      redirectSignOut: string[];
      responseType: 'code';
      providers: ['Google'];
    }
  | null {
  const authConfig = environment.awsConfig.auth;
  const domain = authConfig?.hostedUiDomain?.trim();
  const isNativePlatform = Capacitor.isNativePlatform();
  const googleEnabled = authConfig?.enableGoogleSignIn !== false;

  if (!domain || !googleEnabled) {
    return null;
  }

  const redirectSignIn = (
    isNativePlatform
      ? [authConfig.redirectSignInNative?.trim()]
      : [resolveRedirectUrl(authConfig.redirectSignInWeb, '/auth/callback')]
  ).filter((value): value is string => Boolean(value));

  const redirectSignOut = (
    isNativePlatform
      ? [authConfig.redirectSignOutNative?.trim()]
      : [resolveRedirectUrl(authConfig.redirectSignOutWeb, '/cuenta')]
  ).filter((value): value is string => Boolean(value));

  return {
    domain,
    scopes: ['email', 'openid', 'profile'],
    redirectSignIn: [...new Set(redirectSignIn)],
    redirectSignOut: [...new Set(redirectSignOut)],
    responseType: 'code',
    providers: ['Google']
  };
}

const oauthConfig = buildOAuthConfig();

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.awsConfig.userPoolId,
      userPoolClientId: environment.awsConfig.userPoolWebClientId,
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        ...(oauthConfig ? { oauth: oauthConfig } : {})
      }
    }
  }
});

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private storageService = inject(StorageService);

  async login(username: string, password: string): Promise<{ success: boolean; nextStep?: unknown }> {
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const { isSignedIn, nextStep } = await signIn({ username: normalizedUsername, password });
      return { success: isSignedIn, nextStep };
    } catch (error) {
      console.error('Error durante el login:', error);
      throw error;
    }
  }

  async signUpCustomer(email: string, password: string, fullName: string): Promise<{ userId?: string; nextStep?: unknown }> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();

    const response = await signUp({
      username: normalizedEmail,
      password,
      options: {
        userAttributes: {
          email: normalizedEmail,
          name: normalizedName
        }
      }
    });

    return {
      userId: response.userId,
      nextStep: response.nextStep
    };
  }

  confirmCustomerSignUp(email: string, confirmationCode: string): Promise<unknown> {
    return confirmSignUp({
      username: email.trim().toLowerCase(),
      confirmationCode: confirmationCode.trim()
    });
  }

  resendCustomerSignUpCode(email: string): Promise<unknown> {
    return resendSignUpCode({
      username: email.trim().toLowerCase()
    });
  }

  forgotPassword(email: string): Promise<unknown> {
    return resetPassword({
      username: email.trim().toLowerCase()
    });
  }

  confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Promise<void> {
    return confirmResetPassword({
      username: email.trim().toLowerCase(),
      confirmationCode: confirmationCode.trim(),
      newPassword
    });
  }

  async signInWithGoogle(redirectTo = '/perfil'): Promise<void> {
    if (!oauthConfig) {
      throw new Error('Google Hosted UI no está configurado en el environment actual.');
    }

    await this.setPendingRedirect(redirectTo);

    if (await this.isAuthenticated()) {
      await this.logout();
    }

    await signInWithRedirect({
      provider: 'Google',
      customState: redirectTo,
      options: {
        lang: 'es'
      }
    });
  }

  async handleHostedUiCallback(): Promise<{ success: boolean; redirectTo: string | null; error?: string }> {
    const callbackError = this.readOAuthErrorFromUrl();
    const redirectTo = await this.consumePendingRedirect();

    if (callbackError) {
      return {
        success: false,
        redirectTo,
        error: callbackError
      };
    }

    try {
      await this.waitForAuthenticatedSession();
      return {
        success: true,
        redirectTo
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : 'No fue posible completar la autenticación con Google.';

      return {
        success: false,
        redirectTo,
        error: message
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await Promise.race([
        signOut(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout cerrando sesión')), 5000)
        )
      ]);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      await this.clearPendingRedirect();
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return Boolean(token);
  }

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const payload = session.tokens?.idToken?.payload;
      const attributes = await this.safeFetchUserAttributes();
      const groupsClaim = payload?.['cognito:groups'];
      const groups = Array.isArray(groupsClaim)
        ? groupsClaim.map(group => String(group))
        : groupsClaim
          ? [String(groupsClaim)]
          : [];

      const email =
        this.readStringClaim(payload?.['email']) ||
        this.readStringClaim(attributes['email']) ||
        user.username;

      const name =
        this.readStringClaim(payload?.['name']) ||
        this.readStringClaim(attributes['name']) ||
        email ||
        user.username;

      const avatarUrl =
        this.readStringClaim(payload?.['picture']) ||
        this.readStringClaim(attributes['picture']) ||
        this.readStringClaim(payload?.['profile']) ||
        undefined;

      return {
        userId: user.userId,
        username: user.username,
        email,
        name,
        avatarUrl,
        groups,
        provider: this.resolveAuthProvider([
          payload?.['identities'],
          attributes['identities'],
          user.username
        ])
      };
    } catch {
      return null;
    }
  }

  hasHostedUiConfigured(): boolean {
    return Boolean(oauthConfig);
  }

  setPendingRedirect(path: string): Promise<void> {
    return this.storageService.setJson(CUSTOMER_AUTH_REDIRECT_KEY, path);
  }

  async consumePendingRedirect(): Promise<string | null> {
    const redirectTo = await this.storageService.getJson<string>(CUSTOMER_AUTH_REDIRECT_KEY);
    await this.storageService.remove(CUSTOMER_AUTH_REDIRECT_KEY);
    return typeof redirectTo === 'string' && redirectTo.trim() ? redirectTo.trim() : null;
  }

  private clearPendingRedirect(): Promise<void> {
    return this.storageService.remove(CUSTOMER_AUTH_REDIRECT_KEY);
  }

  private async safeFetchUserAttributes(): Promise<Record<string, string>> {
    try {
      const attributes = await fetchUserAttributes();
      return Object.entries(attributes).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
    } catch {
      return {};
    }
  }

  private async waitForAuthenticatedSession(): Promise<void> {
    const maxAttempts = Capacitor.getPlatform() === 'web' ? 12 : 20;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (await this.isAuthenticated()) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 400));
    }

    throw new Error('La sesión de Cognito no quedó disponible después del redirect.');
  }

  private readOAuthErrorFromUrl(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const rawError =
      queryParams.get('error_description') ||
      queryParams.get('error') ||
      hashParams.get('error_description') ||
      hashParams.get('error');

    if (!rawError?.trim()) {
      return null;
    }

    return decodeURIComponent(rawError.replace(/\+/g, ' '));
  }

  private resolveAuthProvider(values: unknown[]): AuthProvider {
    for (const value of values) {
      const normalized = this.normalizeProviderValue(value);
      if (normalized === 'GOOGLE') {
        return 'GOOGLE';
      }
    }

    return 'COGNITO';
  }

  private normalizeProviderValue(value: unknown): AuthProvider | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        return null;
      }

      if (normalized.includes('google')) {
        return 'GOOGLE';
      }

      return 'COGNITO';
    }

    if (Array.isArray(value)) {
      return value
        .map(item => this.normalizeProviderValue(item))
        .find((provider): provider is AuthProvider => provider !== null) || null;
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;

      return this.normalizeProviderValue(
        record['providerName'] ??
        record['providerType'] ??
        record['identity_provider'] ??
        record['provider']
      );
    }

    return null;
  }

  private readStringClaim(value: unknown): string | null {
    return typeof value === 'string' && value.trim()
      ? value.trim()
      : null;
  }
}
