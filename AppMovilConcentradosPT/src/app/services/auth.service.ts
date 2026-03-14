import { Injectable } from '@angular/core';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { environment } from '../../environments/environment';

export interface AuthenticatedUser {
  userId: string;
  username: string;
  email: string;
  name: string;
  groups: string[];
}

// Configurando Amplify con el Cognito User Pool pre-existente
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.awsConfig.userPoolId,
      userPoolClientId: environment.awsConfig.userPoolWebClientId,
    }
  }
});

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor() { }

  /**
   * Inicia sesión en Cognito
   */
  async login(username: string, password: string): Promise<any> {
    try {
      const { isSignedIn, nextStep } = await signIn({ username, password });
      return { success: isSignedIn, nextStep };
    } catch (error) {
      console.error('Error durante el login:', error);
      throw error;
    }
  }

  /**
   * Cierra la sesión activa actual
   */
  async logout(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  /**
   * Obtiene el token JWT actual (útil para el interceptor)
   */
  async getAuthToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch (error) {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return Boolean(token);
  }

  /**
   * Obtiene la info básica del usuario autenticado
   */
  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const payload = session.tokens?.idToken?.payload;
      const groupsClaim = payload?.['cognito:groups'];
      const groups = Array.isArray(groupsClaim)
        ? groupsClaim.map(group => String(group))
        : groupsClaim
          ? [String(groupsClaim)]
          : [];

      return {
        userId: user.userId,
        username: user.username,
        email: (payload?.['email'] as string) || user.username,
        name: (payload?.['name'] as string) || (payload?.['email'] as string) || user.username,
        groups
      };
    } catch (error) {
      return null;
    }
  }
}
