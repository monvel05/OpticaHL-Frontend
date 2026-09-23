import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // <-- REVISA ESTA RUTA DE AQUÍ
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  // Forzamos explícitamente el tipo de la variable para que TypeScript no tenga dudas
  const authService: AuthService = inject(AuthService); 
  const router = inject(Router);

  return authService.isAuthenticated$.pipe( // <-- Ojo: usamos 'isAuthenticated$' que es el Observable
    take(1),
    map((isAuth) => {
      if (isAuth) {
        return true;
      } else {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
    })
  );
};