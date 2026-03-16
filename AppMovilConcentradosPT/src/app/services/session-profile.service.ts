import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionUserProfile } from '../models/session-profile.model';

@Injectable({
    providedIn: 'root'
})
export class SessionProfileService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.awsConfig.apiUrl}/admin/me`;

    private profileSubject = new BehaviorSubject<SessionUserProfile | null>(null);
    profile$ = this.profileSubject.asObservable();

    get profile(): SessionUserProfile | null {
        return this.profileSubject.value;
    }

    loadProfile(): Observable<SessionUserProfile> {
        return this.http.get<SessionUserProfile>(this.apiUrl).pipe(
            tap(profile => this.profileSubject.next(profile))
        );
    }

    clearProfile(): void {
        this.profileSubject.next(null);
    }

    hasPermission(permission: string): boolean {
        return this.profile?.permissions.includes(permission) ?? false;
    }

    getDefaultRoute(): string {
        return this.profile?.defaultRoute || '/panel-admin';
    }
}
