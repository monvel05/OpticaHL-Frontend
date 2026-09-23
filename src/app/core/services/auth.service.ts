import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../../environment/envs';

// 1. INTERFACES ACTUALIZADAS
export interface Usuario {
  id_operador: number;
  nombre_completo: string;
  usuario_login: string; 
  roles: string[];
  id_sucursal: number; // Vital para la separación de datos por sucursal en el backend
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

  // 2. ESTADOS REACTIVOS
  private authState = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.authState.asObservable();

  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // 3. CACHÉ EN MEMORIA (Para acceso síncrono ultra-rápido en Interceptors)
  private currentToken: string | null = null;

  constructor() {
    this.checkToken();
  }

  // =====================
  // LOGIN & LOGOUT
  // =====================

  login(credenciales: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(async (response: any) => {
        if (response && response.token) {
          
          let usuarioLogueado = response.usuario || response.user || {};
          
          // BYPASS: Inyección de rol de emergencia si el backend falla
          if (!usuarioLogueado.roles || usuarioLogueado.roles.length === 0) {
            console.warn('⚠️ Roles vacíos detectados. Aplicando rol MOSTRADOR de emergencia.');
            usuarioLogueado.roles = ['MOSTRADOR'];
          }
          
          // Formatear a array si viene como string
          if (typeof usuarioLogueado.roles === 'string') {
            usuarioLogueado.roles = [usuarioLogueado.roles];
          }

          // Guardar caché en memoria
          this.currentToken = response.token;
          
          // Persistencia en Capacitor
          await Preferences.set({ key: 'auth_token', value: response.token });
          await Preferences.set({ key: 'usuario', value: JSON.stringify(usuarioLogueado) });
          
          // Actualizar estados reactivos
          this.currentUserSubject.next(usuarioLogueado);
          this.authState.next(true);
        }
      })
    );
  }

  async logout(): Promise<void> {
    this.currentToken = null; // Limpiar memoria
    await Preferences.clear(); // Limpiar persistencia
    
    this.currentUserSubject.next(null);
    this.authState.next(false);
    
    this.router.navigate(['/login']);
  }

  // =====================
  // INICIALIZACIÓN Y PERSISTENCIA
  // =====================

  private async checkToken() {
    try {
      const token = await this.getTokenAsync();
      const { value: usuarioJson } = await Preferences.get({ key: 'usuario' });

      if (token && !this.isTokenExpired(token) && usuarioJson && usuarioJson !== 'undefined' && usuarioJson !== 'null') {
        this.currentToken = token; // Cargar a memoria
        this.currentUserSubject.next(JSON.parse(usuarioJson));
        this.authState.next(true);
      } else {
        await this.logout();
      }
    } catch (e) {
      console.warn('Error al restaurar sesión. Limpiando credenciales...', e);
      await this.logout();
    }
  }

  /** Método asíncrono para Capacitor */
  private async getTokenAsync(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'auth_token' });
    return value;
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload || !payload.exp) return true; 
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  private decodePayload(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }

  // =====================
  // ⚡ NUEVOS MÉTODOS SÍNCRONOS (Para Guards e Interceptors)
  // =====================

  /** 
   * Devuelve si el usuario está autenticado instantáneamente.
   * Ideal para el auth.guard.ts
   */
  estaAutenticado(): boolean {
    return this.authState.value;
  }

  /** 
   * Extrae los roles actuales del usuario en memoria.
   * Usado por el role.guard.ts
   */
  obtenerRolesActuales(): string[] {
    const user = this.currentUserSubject.value;
    return user?.roles || [];
  }

  /**
   * Verifica instantáneamente si el usuario tiene al menos un rol permitido.
   */
  tieneRolesPermitidos(rolesPermitidos: string[]): boolean {
    if (!rolesPermitidos || rolesPermitidos.length === 0) return true;
    const misRoles = this.obtenerRolesActuales().map(r => r.toUpperCase());
    return rolesPermitidos.some(rol => misRoles.includes(rol.toUpperCase()));
  }

  /**
   * Obtiene la sucursal activa del operador.
   * Crítico para inyectar en las peticiones de ventas, inventario y caja.
   */
  obtenerSucursalActual(): number | null {
    return this.currentUserSubject.value?.id_sucursal || null;
  }

  /**
   * Obtiene el token de manera síncrona. 
   */
  getTokenSync(): string | null {
    return this.currentToken;
  }
}