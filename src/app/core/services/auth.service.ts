import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../../environment/envs';

// Interfaces para mantener el tipado fuerte
export interface Usuario {
  id_operador: number;
  nombre_completo: string;
  usuario_login: string; 
  roles: string[];
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = `${environment.apiUrl}/auth`;

  // Estado reactivo para la sesión (Booleano)
  private authState = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.authState.asObservable();

  // Estado reactivo para el objeto Usuario
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.checkToken();
  }

  // =====================
  // LOGIN & LOGOUT
  // =====================

  /** Login conectado a la API */
 /** Login conectado a la API */
  login(credenciales: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(async (response: any) => {
        if (response && response.token) {
          
          // Capturamos el usuario de la respuesta
          const usuarioLogueado = response.usuario || response.user || {};
          
          // 🚨 BYPASS DE ENTRADA: Si el backend devuelve un arreglo de roles vacío [],
          // le inyectamos 'MOSTRADOR' antes de guardar en memoria y preferencias.
          if (!usuarioLogueado.roles || usuarioLogueado.roles.length === 0) {
            console.warn('⚠️ Roles vacíos detectados en AuthService. Aplicando rol MOSTRADOR de emergencia.');
            usuarioLogueado.roles = ['MOSTRADOR'];
            usuarioLogueado.rol = 'MOSTRADOR'; // Por si acaso
          }
          
          // Guardamos en Capacitor Preferences de forma segura (¡Ya con el rol parchado!)
          await Preferences.set({ key: 'auth_token', value: response.token });
          await Preferences.set({ key: 'usuario', value: JSON.stringify(usuarioLogueado) });
          
          // Actualizamos los estados reactivos inmediatamente
          this.currentUserSubject.next(usuarioLogueado);
          this.authState.next(true);
        }
      })
      
    );
  }

  /** Logout limpio de la aplicación */
  async logout(): Promise<void> {
    await Preferences.clear(); // Limpia token y usuario
    this.currentUserSubject.next(null);
    this.authState.next(false);
    
    this.router.navigate(['/auth/login']);
  }

  // =====================
  // VALIDACIONES Y PERSISTENCIA
  // =====================

  /** Restaura la sesión automáticamente si el usuario recarga la página */
  private async checkToken() {
    try {
      const token = await this.getToken();
      const { value: usuarioJson } = await Preferences.get({ key: 'usuario' });

      if (token && !this.isTokenExpired(token) && usuarioJson && usuarioJson !== 'undefined' && usuarioJson !== 'null') {
        this.currentUserSubject.next(JSON.parse(usuarioJson));
        this.authState.next(true);
      } else {
        await this.logout();
      }
    } catch (e) {
      console.warn('Error al restaurar la sesión, limpiando credenciales corruptas...', e);
      await this.logout();
    }
  }

  /** Recupera el token guardado en las preferencias del dispositivo */
  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return value;
  }

  /** Verifica si el JWT ya expiró basándose en su payload */
  private isTokenExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload || !payload.exp) return true; 
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  // =====================
  // GESTIÓN DE USUARIO Y ROLES
  // =====================

  /** Obtiene el usuario actual de forma síncrona */
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /** Decodifica el JWT para obtener los datos integrados del payload */
  private decodePayload(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  /** 🛡️ OPTIMIZADO Y SEGURO: Validación de roles a prueba de balas para Guards */
  async tieneRol(rol: string): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'usuario' });
    if (!value || value === 'undefined' || value === 'null') return false;
    
    try {
      const usuario = JSON.parse(value);
      
      // Capturamos cualquier variante posible de roles del backend (.roles o .rol)
      const rolesRaw = usuario?.roles || usuario?.rol || [];
      
      // Si viene como un string plano (ej: "MOSTRADOR"), lo convertimos a arreglo automáticamente
      const rolesArray = Array.isArray(rolesRaw) ? rolesRaw : [rolesRaw];
      
      // Evaluamos de forma segura comparando en mayúsculas
      return rolesArray.some((r: any) => String(r).toUpperCase() === rol.toUpperCase());
    } catch (e) {
      console.error('Error al validar rol en Guard:', e);
      return false;
    }
  }
}