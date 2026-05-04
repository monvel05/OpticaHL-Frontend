import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { tap, map } from 'rxjs/operators';
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

  // Estado reactivo para que los componentes reaccionen al login/logout
  private authState = new BehaviorSubject<boolean>(false);

  constructor() {
    this.checkToken();
  }

  // =====================
  // LOGIN & LOGOUT
  // =====================

  login(credenciales: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(async (response) => {
        if (response.token) {
          // Guardamos en Capacitor Preferences (Móvil/Web)
          await Preferences.set({ key: 'auth_token', value: response.token });
          // Guardamos el objeto usuario (convertido a string)
          await Preferences.set({ key: 'usuario', value: JSON.stringify(response.usuario) });
          
          this.authState.next(true);
        }
      })
    );
  }

  async logout(): Promise<void> {
    await Preferences.clear(); // Limpia todo (token y usuario)
    this.authState.next(false);
    this.router.navigate(['/login']);
  }

  // =====================
  // VALIDACIONES DE TOKEN
  // =====================

  private async checkToken() {
    const token = await this.getToken();
    this.authState.next(!!token && !this.isTokenExpired(token));
  }

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return value;
  }

  // Método sincrónico para el Interceptor (usando localStorage como espejo o lectura rápida)
  // Nota: Capacitor guarda en localStorage en Web automáticamente
  getTokenSync(): string | null {
    return localStorage.getItem('auth_token');
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload || !payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  // =====================
  // GESTIÓN DE USUARIO Y ROLES
  // =====================

  async getUsuario(): Promise<Usuario | null> {
    const { value } = await Preferences.get({ key: 'usuario' });
    return value ? JSON.parse(value) : null;
  }

  // Devuelve un Observable para saber si está autenticado
  isAuthenticated(): Observable<boolean> {
    return this.authState.asObservable();
  }

  /** Decodifica el JWT para obtener los roles o expiración */
  private decodePayload(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  // Validación de roles (basado en el código de tu compañero)
  async tieneRol(rol: string): Promise<boolean> {
    const usuario = await this.getUsuario();
    return usuario ? usuario.roles.includes(rol) : false;
  }
}