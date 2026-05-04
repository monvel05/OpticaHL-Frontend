import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  //  Validar sesión

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }


 //Validar roles

  const rolesPermitidos = route.data?.['roles'];

  if (rolesPermitidos && rolesPermitidos.length > 0) {

    const tieneAcceso = authService.tieneAlgunRol(rolesPermitidos);

    if (!tieneAcceso) {
      router.navigate(['/dashboard']); // o página de acceso denegado
      return false;
    }
  }

  return true;
};
