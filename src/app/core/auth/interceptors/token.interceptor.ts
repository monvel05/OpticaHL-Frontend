import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service'; // 👈 CORREGIDO: Subimos un solo nivel para entrar a 'services'
import { from, switchMap } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return from(authService.getToken()).pipe(
    switchMap((res: any) => {
      // Extraemos el string real por si Capacitor encapsula el valor en un objeto { value: '...' }
      let token = (res && typeof res === 'object' && 'value' in res) ? res.value : res;

      // Forzar a string y limpiar espacios vacíos
      if (token && typeof token === 'string') {
        token = token.trim();
      }

      // 🔍 Chismoso temporal en consola para comprobar si el interceptor está leyendo el JWT
      console.log('--- INTERCEPTOR DE SEGURIDAD ---');
      console.log('¿Se detectó token activo?:', token ? 'SÍ (Enviando en la petición)' : 'NO (Petición limpia)');
      console.log('Valor del Token recuperado:', token);
      console.log('--------------------------------');

      // Si el token es un JWT válido
      if (token && token !== 'null' && token !== 'undefined' && token !== '') {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }

      // Si no hay token, la petición sigue limpia (ej: en el Login)
      return next(req);
    })
  );
};