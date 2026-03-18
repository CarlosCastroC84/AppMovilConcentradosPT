import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SessionProfileService } from '../services/session-profile.service';

export const adminGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const sessionProfileService = inject(SessionProfileService);
  const router = inject(Router);

  if (!(await authService.isAuthenticated())) {
    return router.createUrlTree(['/login-operativo'], {
      queryParams: {
        redirectTo: state.url
      }
    });
  }

  try {
    if (!sessionProfileService.profile) {
      await firstValueFrom(sessionProfileService.loadProfile());
    }

    return true;
  } catch {
    return router.createUrlTree(['/login-operativo'], {
      queryParams: {
        redirectTo: state.url
      }
    });
  }
};
