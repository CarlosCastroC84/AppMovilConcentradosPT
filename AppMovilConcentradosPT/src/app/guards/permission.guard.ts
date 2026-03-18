import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SessionProfileService } from '../services/session-profile.service';
import { StaffPermission } from '../models/session-profile.model';

export const permissionGuard = (permission: StaffPermission): CanActivateFn => {
    return async (_route, state) => {
        const authService = inject(AuthService);
        const sessionProfileService = inject(SessionProfileService);
        const router = inject(Router);

        if (!(await authService.isAuthenticated())) {
            return router.createUrlTree(['/login-operativo'], {
                queryParams: { redirectTo: state.url }
            });
        }

        try {
            if (!sessionProfileService.profile) {
                await firstValueFrom(sessionProfileService.loadProfile());
            }
        } catch (error) {
            return router.createUrlTree(['/login-operativo'], {
                queryParams: { redirectTo: state.url }
            });
        }

        if (sessionProfileService.hasPermission(permission)) {
            return true;
        }

        return router.createUrlTree([sessionProfileService.getDefaultRoute()]);
    };
};
