import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Roles permitidos definidos en las rutas (Ej: ['ADMINISTRADOR', 'MOSTRADOR'])
  const expectedRoles: string[] = route.data['roles'] || [];
  const currentUser = authService.getCurrentUser();

  if (!currentUser || !currentUser.roles) {
    router.navigate(['/login']);
    return false;
  }

  // Verifica si el operador tiene al menos uno de los roles requeridos
  // FIX: Se agregó explícitamente el tipo de dato (rol: string)
  const hasRole = currentUser.roles.some((rol: string) => expectedRoles.includes(rol));

  if (hasRole) {
    return true;
  }

  // Redirige si un MOSTRADOR intenta entrar a áreas de ADMINISTRADOR
  router.navigate(['/acceso-denegado']);
  return false;
};
