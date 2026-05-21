import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { from, switchMap } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // 1. Convertimos la Promesa del token en un Observable de RxJS
  return from(authService.getToken()).pipe(
    switchMap((token) => {
      // 2. Si el token existe de verdad (el string del JWT)
      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }

      // 3. Si no hay token, la petición sigue limpia sin el header
      return next(req);
    })
  );
};