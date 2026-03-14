import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  // Convertimos la promesa del token en un Observable y usamos switchMap
  // Esto previene que se rompa Angular's Zone.js y la pantalla deje de actualizarse
  return from(authService.getAuthToken()).pipe(
    switchMap(token => {
      if (token) {
        // Clonamos la petición y agregamos el header Authorization
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedReq);
      }

      // Si no hay token, enviamos la petición original
      return next(req);
    })
  );
};
