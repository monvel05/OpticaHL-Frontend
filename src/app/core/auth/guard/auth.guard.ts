import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guard de Autenticación y Autorización Unificado.
 * Protege las rutas verificando primero si existe una sesión activa (JWT válido).
 * Posteriormente, si la ruta define roles específicos requeridos (RBAC),
 * valida que el usuario actual posea al menos uno de dichos roles.
 *
 * @param route Información sobre la ruta a la que se intenta acceder.
 * @returns booleano que indica si se permite la navegación.
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Validación de sesión (Autenticación)
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Extraer roles permitidos para la ruta
  const rolesPermitidos: string[] = route.data?.['roles'] || [];

  // Si la ruta no exige roles específicos, se permite el acceso
  if (rolesPermitidos.length === 0) {
    return true;
  }

  // 3. Validación de acceso por roles (Autorización / RBAC)
  const tieneAcceso = authService.tieneAlgunRol(rolesPermitidos);

  if (!tieneAcceso) {
    // Redirigir a una vista segura o de acceso denegado
    router.navigate(['/dashboard']); 
    return false;
  }

  return true;
};