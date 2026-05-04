import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { map, take, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';

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

  // 1. Usamos el Observable de autenticación
  return authService.isAuthenticated().pipe(
    take(1), // Nos aseguramos de tomar solo el valor actual y cerrar la suscripción
    switchMap(isAuth => {
      
      // SI NO ESTÁ AUTENTICADO
      if (!isAuth) {
        router.navigate(['/login']);
        return of(false);
      }

      // 2. VALIDAR ROLES (Si la ruta los requiere)
      const rolesPermitidos = route.data?.['roles'] as string[];

      if (rolesPermitidos && rolesPermitidos.length > 0) {
        // Convertimos la promesa de 'tieneRol' en un observable
        return from(authService.getUsuario()).pipe(
          map(usuario => {
            const tieneAcceso = usuario?.roles.some(rol => rolesPermitidos.includes(rol));
            
            if (tieneAcceso) {
              return true;
            } else {
              router.navigate(['/login']); // Redirigir si no tiene permiso
              return false;
            }
          })
        );
      }

      // Si está autenticado y la ruta no pide roles específicos
      return of(true);
    })
  );
};