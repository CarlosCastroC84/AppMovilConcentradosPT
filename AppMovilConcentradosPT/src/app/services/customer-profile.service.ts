import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { CustomerProfile, UpdateCustomerProfileRequest } from '../models/customer-profile.model';
import { unwrapApiEntity, unwrapApiResponse } from '../utils/api-response.util';
import { AuthService, AuthenticatedUser } from './auth.service';
import { StorageService } from './storage.service';

const CUSTOMER_PROFILE_CACHE_KEY = 'customer_profile_cache';

@Injectable({
  providedIn: 'root'
})
export class CustomerProfileService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private apiUrl = `${environment.awsConfig.apiUrl}/clientes/me`;

  private profileSubject = new BehaviorSubject<CustomerProfile | null>(null);
  readonly profile$ = this.profileSubject.asObservable();

  get profile(): CustomerProfile | null {
    return this.profileSubject.value;
  }

  getProfile(): CustomerProfile | null {
    return this.profileSubject.value;
  }

  bootstrapProfile(): Observable<CustomerProfile> {
    if (this.profileSubject.value) {
      return of(this.profileSubject.value);
    }

    return from(this.loadProfileInternal());
  }

  loadProfile(): Observable<CustomerProfile> {
    return from(this.loadProfileInternal());
  }

  updateProfile(payload: UpdateCustomerProfileRequest): Observable<CustomerProfile> {
    return from(this.updateProfileInternal(payload));
  }

  clearProfile(): void {
    this.profileSubject.next(null);
  }

  isProfileComplete(profile: CustomerProfile | null = this.profileSubject.value): boolean {
    if (!profile) {
      return false;
    }

    return [
      profile.fullName,
      profile.phone,
      profile.municipality
    ].every(value => value.trim().length > 0);
  }

  private async loadProfileInternal(): Promise<CustomerProfile> {
    const currentUser = await this.requireCurrentUser();
    const cachedProfile = await this.readCachedProfile(currentUser.userId);

    try {
      const response = await this.http.get<unknown>(this.apiUrl).toPromise();
      const profile = this.normalizeProfile(response, currentUser, cachedProfile);
      await this.persistProfile(profile);
      return profile;
    } catch (error) {
      if (cachedProfile) {
        this.profileSubject.next(cachedProfile);
        return cachedProfile;
      }

      const fallbackProfile = this.buildFallbackProfile(currentUser, null);
      await this.persistProfile(fallbackProfile);
      console.warn('No fue posible cargar /clientes/me. Usando perfil local derivado de Cognito.', error);
      return fallbackProfile;
    }
  }

  private async updateProfileInternal(payload: UpdateCustomerProfileRequest): Promise<CustomerProfile> {
    const currentUser = await this.requireCurrentUser();
    const currentProfile = this.profileSubject.value ?? await this.loadProfileInternal();

    const normalizedPayload: UpdateCustomerProfileRequest = {
      fullName: payload.fullName.trim(),
      phone: payload.phone.trim(),
      municipality: payload.municipality.trim(),
      addressReference: payload.addressReference?.trim() || undefined
    };

    try {
      const response = await this.http.put<unknown>(this.apiUrl, normalizedPayload).toPromise();
      const profile = this.normalizeProfile(response, currentUser, {
        ...currentProfile,
        ...normalizedPayload
      });
      await this.persistProfile(profile);
      return profile;
    } catch (error) {
      const fallbackProfile = this.buildFallbackProfile(currentUser, {
        ...currentProfile,
        ...normalizedPayload
      });
      await this.persistProfile(fallbackProfile);
      console.warn('No fue posible persistir /clientes/me. Se guardó el perfil en caché local.', error);
      return fallbackProfile;
    }
  }

  private normalizeProfile(
    response: unknown,
    currentUser: AuthenticatedUser,
    fallback: Partial<CustomerProfile> | null
  ): CustomerProfile {
    const profileEntity = unwrapApiEntity<unknown | null>(response, ['perfil', 'profile', 'item', 'data']);
    const payload = profileEntity ?? unwrapApiResponse<unknown>(response);
    const record = this.toRecord(payload);

    const fullName =
      this.pickString(record, ['fullName', 'name', 'nombre']) ||
      this.normalizeDisplayName(fallback?.fullName || null) ||
      this.normalizeDisplayName(currentUser.name) ||
      '';

    const phone =
      this.pickString(record, ['phone', 'telefono', 'celular']) ||
      fallback?.phone ||
      '';

    const municipality =
      this.pickString(record, ['municipality', 'municipio', 'location', 'customerLocation']) ||
      fallback?.municipality ||
      '';

    const addressReference =
      this.pickString(record, ['addressReference', 'reference', 'referencia']) ||
      fallback?.addressReference ||
      undefined;

    return {
      userId:
        this.pickString(record, ['userId', 'id', 'sub']) ||
        fallback?.userId ||
        currentUser.userId,
      email:
        this.pickString(record, ['email', 'correo']) ||
        fallback?.email ||
        currentUser.email,
      fullName,
      phone,
      municipality,
      addressReference,
      authProvider: this.pickAuthProvider(record['authProvider']) || fallback?.authProvider || currentUser.provider,
      createdAt:
        this.pickDateString(record, ['createdAt', 'fechaCreacion']) ||
        fallback?.createdAt ||
        new Date().toISOString(),
      updatedAt:
        this.pickDateString(record, ['updatedAt', 'fechaActualizacion']) ||
        new Date().toISOString()
    };
  }

  private buildFallbackProfile(
    currentUser: AuthenticatedUser,
    partial: Partial<CustomerProfile> | null
  ): CustomerProfile {
    return {
      userId: partial?.userId || currentUser.userId,
      email: partial?.email || currentUser.email,
      fullName:
        this.normalizeDisplayName(partial?.fullName || null) ||
        this.normalizeDisplayName(currentUser.name) ||
        '',
      phone: partial?.phone || '',
      municipality: partial?.municipality || '',
      addressReference: partial?.addressReference || undefined,
      authProvider: partial?.authProvider || currentUser.provider,
      createdAt: partial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private async requireCurrentUser(): Promise<AuthenticatedUser> {
    const currentUser = await this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('No hay una sesión de cliente activa.');
    }

    return currentUser;
  }

  private async readCachedProfile(userId: string): Promise<CustomerProfile | null> {
    const cachedProfile = await this.storageService.getJson<CustomerProfile>(CUSTOMER_PROFILE_CACHE_KEY);

    if (!cachedProfile || cachedProfile.userId !== userId) {
      return null;
    }

    return this.sanitizeProfile(cachedProfile);
  }

  private async persistProfile(profile: CustomerProfile): Promise<void> {
    const sanitizedProfile = this.sanitizeProfile(profile);
    this.profileSubject.next(sanitizedProfile);
    await this.storageService.setJson(CUSTOMER_PROFILE_CACHE_KEY, sanitizedProfile);
  }

  private toRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null
      ? value as Record<string, unknown>
      : {};
  }

  private pickString(record: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private pickDateString(record: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
    }

    return null;
  }

  private pickAuthProvider(value: unknown): CustomerProfile['authProvider'] | null {
    if (value === 'GOOGLE' || value === 'COGNITO') {
      return value;
    }

    if (typeof value === 'string' && value.trim().toLowerCase().includes('google')) {
      return 'GOOGLE';
    }

    return null;
  }

  private normalizeDisplayName(value: string | null | undefined): string | null {
    if (!value?.trim()) {
      return null;
    }

    const normalizedValue = value.trim();

    return normalizedValue.includes('@')
      ? null
      : normalizedValue;
  }

  private sanitizeProfile(profile: CustomerProfile): CustomerProfile {
    return {
      ...profile,
      fullName: this.normalizeDisplayName(profile.fullName) || ''
    };
  }
}
