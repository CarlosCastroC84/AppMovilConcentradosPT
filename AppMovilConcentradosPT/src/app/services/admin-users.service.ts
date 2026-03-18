import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { unwrapApiArray, unwrapApiEntity, unwrapApiResponse } from '../utils/api-response.util';
import {
    AdminUser,
    AdminUserRole,
    CognitoAdminUserStatus,
    CreateAdminUserRequest
} from '../models/admin-user.model';

type CognitoAttribute = {
    Name?: string;
    Value?: string;
    name?: string;
    value?: string;
};

@Injectable({
    providedIn: 'root'
})
export class AdminUsersService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.awsConfig.apiUrl}/admin/usuarios`;

    listUsers(): Observable<AdminUser[]> {
        return this.http.get<unknown>(this.apiUrl).pipe(
            map(response =>
                unwrapApiArray<unknown>(response, ['usuarios', 'users', 'items', 'data'])
                    .map(item => this.normalizeUser(item))
                    .filter(user => Boolean(user.username))
            )
        );
    }

    createUser(payload: CreateAdminUserRequest): Observable<AdminUser> {
        return this.http.post<unknown>(this.apiUrl, payload).pipe(
            map(response => {
                const user = unwrapApiEntity<unknown | null>(response, ['usuario', 'user', 'item', 'data']);
                return this.normalizeUser(user, {
                    username: payload.email,
                    email: payload.email,
                    name: payload.name,
                    role: payload.role,
                    enabled: true,
                    status: 'FORCE_CHANGE_PASSWORD'
                });
            })
        );
    }

    setUserEnabled(username: string, enabled: boolean): Observable<void> {
        return this.http.patch<unknown>(
            `${this.apiUrl}/${encodeURIComponent(username)}/estado`,
            { enabled }
        ).pipe(
            map(response => {
                unwrapApiResponse(response);
                return void 0;
            })
        );
    }

    resetUserPassword(username: string): Observable<{ message?: string }> {
        return this.http.post<unknown>(
            `${this.apiUrl}/${encodeURIComponent(username)}/reset-password`,
            {}
        ).pipe(
            map(response => unwrapApiResponse<{ message?: string }>(response))
        );
    }

    private normalizeUser(input: unknown, fallback: Partial<AdminUser> = {}): AdminUser {
        const record = this.toRecord(input);
        const attributes = this.readAttributes(record['Attributes'] ?? record['attributes']);
        const groups = this.readStringArray(record['groups'] ?? record['Groups']);

        const email =
            this.pickString(record, ['email']) ||
            this.readAttribute(attributes, 'email') ||
            fallback.email ||
            '';

        const username =
            this.pickString(record, ['username', 'Username', 'userId', 'id']) ||
            fallback.username ||
            email;

        const name =
            this.pickString(record, ['name']) ||
            this.readAttribute(attributes, 'name') ||
            fallback.name ||
            email ||
            username;

        const roleSource =
            this.pickString(record, ['role', 'group']) ||
            groups[0] ||
            fallback.role ||
            'VENTAS';

        return {
            username,
            email,
            name,
            role: this.normalizeRole(roleSource),
            enabled: this.pickBoolean(record, ['enabled', 'Enabled']) ?? fallback.enabled ?? true,
            status: this.normalizeStatus(
                this.pickString(record, ['status', 'UserStatus']) || fallback.status || 'UNKNOWN'
            ),
            createdAt: this.pickDateString(record, ['createdAt', 'UserCreateDate']) || fallback.createdAt,
            updatedAt: this.pickDateString(record, ['updatedAt', 'UserLastModifiedDate']) || fallback.updatedAt
        };
    }

    private normalizeRole(value: string): AdminUserRole {
        const normalized = value.trim().toUpperCase();

        if (normalized.includes('ADMIN')) {
            return 'ADMIN';
        }

        if (normalized.includes('GERENT')) {
            return 'GERENTE';
        }

        if (normalized.includes('VENTA')) {
            return 'VENTAS';
        }

        if (normalized.includes('BODEGA')) {
            return 'BODEGA';
        }

        return 'VENTAS';
    }

    private normalizeStatus(value: string): CognitoAdminUserStatus {
        const normalized = value.trim().toUpperCase();

        switch (normalized) {
            case 'CONFIRMED':
            case 'FORCE_CHANGE_PASSWORD':
            case 'RESET_REQUIRED':
            case 'UNCONFIRMED':
            case 'ARCHIVED':
            case 'COMPROMISED':
                return normalized;
            default:
                return 'UNKNOWN';
        }
    }

    private toRecord(value: unknown): Record<string, unknown> {
        return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
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

    private pickBoolean(record: Record<string, unknown>, keys: string[]): boolean | null {
        for (const key of keys) {
            const value = record[key];
            if (typeof value === 'boolean') {
                return value;
            }
        }

        return null;
    }

    private pickDateString(record: Record<string, unknown>, keys: string[]): string | undefined {
        for (const key of keys) {
            const value = record[key];
            if (typeof value === 'string' || value instanceof Date || typeof value === 'number') {
                const parsed = new Date(value);
                if (!Number.isNaN(parsed.getTime())) {
                    return parsed.toISOString();
                }
            }
        }

        return undefined;
    }

    private readAttributes(value: unknown): CognitoAttribute[] {
        if (!Array.isArray(value)) {
            return [];
        }

        return value.filter(
            item => typeof item === 'object' && item !== null
        ) as CognitoAttribute[];
    }

    private readAttribute(attributes: CognitoAttribute[], name: string): string | null {
        const match = attributes.find(attribute =>
            attribute.Name === name || attribute.name === name
        );

        if (!match) {
            return null;
        }

        return match.Value || match.value || null;
    }

    private readStringArray(value: unknown): string[] {
        if (!Array.isArray(value)) {
            return [];
        }

        return value
            .filter(item => typeof item === 'string')
            .map(item => item.trim())
            .filter(Boolean);
    }
}
