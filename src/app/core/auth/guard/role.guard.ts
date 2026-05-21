import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // <-- Asegúrate de que esta ruta apunte bien a tu servicio
import { Usuario } from '../../services/auth.service'; // <-- También importamos la interfaz Usuario para el tipado

export const roleGuard: CanActivateFn = (route, state) => {
  // Forzamos explícitamente el tipo AuthService para quitar el error 'unknown'
  const authService: AuthService = inject(AuthService);
  const router = inject(Router);

  // Leemos los roles permitidos en la ruta
  const rolesPermitidos = route.data['roles'] as Array<string>;

  if (!rolesPermitidos || rolesPermitidos.length === 0) {
    return true;
  }

  // Obtenemos el usuario de forma síncrona desde el servicio optimizado
  const usuario: Usuario | null = authService.getCurrentUser();

  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  // Verificamos si tiene el rol (ignorando mayúsculas/minúsculas)
  const tienePermiso = usuario.roles.some(rol => 
    rolesPermitidos.map(r => r.toUpperCase()).includes(rol.toUpperCase())
  );

  if (tienePermiso) {
    return true;
  } else {
    console.warn(`Acceso denegado. Se requiere uno de estos roles: ${rolesPermitidos}`);
    router.navigate(['/home']); // Modifica '/home' por tu ruta por defecto si es otra
    return false;
  }
};