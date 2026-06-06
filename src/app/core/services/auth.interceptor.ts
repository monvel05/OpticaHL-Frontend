import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service'; // 👈 Asegúrate de que la ruta a tu AuthService sea la correcta
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  // Convertimos la Promesa de Capacitor Preferences a un Observable de RxJS
  return from(authService.getToken()).pipe(
    switchMap(token => {
      // Si tenemos un token guardado, clonamos la petición y le inyectamos el encabezado Authorization
      if (token) {
        const clonedRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedRequest);
      }
      
      // Si no hay token (como en el Login), dejamos pasar la petición limpia
      return next(req);
    })
  );
};