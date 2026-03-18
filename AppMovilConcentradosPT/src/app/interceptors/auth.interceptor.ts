import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

const publicGetApiPaths = new Set([
  '/productos',
  '/categorias-producto',
  '/marcas-producto',
  '/presentaciones-producto'
]);

function isPublicApiRequest(req: HttpRequest<unknown>): boolean {
  if (req.method !== 'GET') {
    return false;
  }

  const apiBaseUrl = environment.awsConfig.apiUrl;
  if (!req.url.startsWith(apiBaseUrl)) {
    return false;
  }

  const requestPath = req.url.slice(apiBaseUrl.length).split('?')[0] || '/';
  return publicGetApiPaths.has(requestPath);
}

async function resolveTokenWithTimeout(authService: AuthService, timeoutMs = 1200): Promise<string | null> {
  try {
    return await Promise.race<string | null>([
      authService.getAuthToken(),
      new Promise<string | null>(resolve => {
        setTimeout(() => resolve(null), timeoutMs);
      })
    ]);
  } catch {
    return null;
  }
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  if (isPublicApiRequest(req)) {
    return next(req);
  }

  const authService = inject(AuthService);

  return from(resolveTokenWithTimeout(authService)).pipe(
    switchMap(token => {
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedReq);
      }

      return next(req);
    }),
    catchError(() => {
      return next(req);
    })
  );
};
