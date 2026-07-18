import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastController } from '@ionic/angular/standalone';

export const roleGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);
  
  // Extraemos el array de roles permitidos desde la configuración de la ruta
  const expectedRoles: string[] = route.data['expectedRoles'] || [];
  
  // Asumimos que tu servicio tiene un método síncrono o un signal con el rol
  const userRoles = authService.obtenerRolesActuales(); 

  // Validamos autenticación y si el rol del usuario está incluido en los permitidos
  if (authService.estaAutenticado() && expectedRoles.some(rol => userRoles.includes(rol))) {
    return true;
  }

  // UX: Notificación nativa de Ionic informando el bloqueo
  const toast = await toastCtrl.create({
    message: 'Acceso denegado: No tienes los permisos necesarios para esta sección.',
    duration: 3000,
    color: 'danger',
    position: 'bottom',
    icon: 'lock-closed-outline'
  });
  await toast.present();

  // Redirección de seguridad (fallback) a la pantalla principal operativa
  router.navigate(['/mostrador']);
  return false;
};