import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const rolesPermitidos: string[] = route.data?.['roles'] || [];

  // Validar sesión

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  //Si no hay roles definidos → permitir

  if (rolesPermitidos.length === 0) {
    return true;
  }

  // Validar roles

  const tieneAcceso = authService.tieneAlgunRol(rolesPermitidos);

  if (tieneAcceso) {
    return true;
  }

  // Acceso denegado

  router.navigate(['/dashboard']); // evita error si no tienes acceso-denegado
  return false;
};
