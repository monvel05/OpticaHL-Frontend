import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from } from 'rxjs';
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

  // Tarea 2.1: Estado reactivo para el objeto Usuario (Permite usar getCurrentUser de forma síncrona)
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.checkToken();
  }

  // =====================
  // LOGIN & LOGOUT
  // =====================

  // Tarea 2.1: Login conectado a la API de tu compañera
  login(credenciales: { usuario_login: string; contrasena: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(async (response) => {
        if (response && response.token) {
          // Tarea 3.3: Guardamos en Capacitor Preferences de forma segura
          await Preferences.set({ key: 'auth_token', value: response.token });
          await Preferences.set({ key: 'usuario', value: JSON.stringify(response.usuario) });
          
          // Actualizamos los estados reactivos inmediatamente
          this.currentUserSubject.next(response.usuario);
          this.authState.next(true);
        }
      })
    );
  }

  // Tarea 2.1: Logout limpio
  async logout(): Promise<void> {
    await Preferences.clear(); // Limpia token y usuario
    this.currentUserSubject.next(null);
    this.authState.next(false);
    this.router.navigate(['/login']);
  }

  // =====================
  // VALIDACIONES Y PERSISTENCIA (Tarea 3.3)
  // =====================

  // Restaura la sesión automáticamente si el usuario recarga la página
 // Así debe quedar corregido:
private async checkToken() {
  const token = await this.getToken();
  const { value: usuarioJson } = await Preferences.get({ key: 'usuario' });

  if (token && !this.isTokenExpired(token) && usuarioJson) {
    this.currentUserSubject.next(JSON.parse(usuarioJson));
    this.authState.next(true);
  } else {
    await this.logout();
  }
}

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return value;
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload || !payload.exp) return true; // Si no hay exp, asumimos expirado por seguridad
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  // =====================
  // GESTIÓN DE USUARIO Y ROLES
  // =====================

  // Tarea 2.1: getCurrentUser() síncrono exigido por el Core de Angular
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /** Decodifica el JWT para obtener los datos integrados del payload si se requiere */
  private decodePayload(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  // Tarea 2.3: Validación de roles asíncrona para el RoleGuard
  async tieneRol(rol: string): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'usuario' });
    if (!value) return false;
    
    try {
      const usuario: Usuario = JSON.parse(value);
      // Soporta si el backend manda el rol en mayúsculas o minúsculas
      return usuario.roles.some(r => r.toUpperCase() === rol.toUpperCase());
    } catch (e) {
      return false;
    }
  }
}