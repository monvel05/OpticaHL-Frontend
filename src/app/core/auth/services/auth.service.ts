import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

// Interfaces
export interface LoginCredentials {
  usuario_login: string;
  password: string;
}

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

  private apiUrl = 'http://localhost:3000/api/auth';
  
  // LOGIN

  login(credenciales: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
        }
      })
    );
  }

  //LOGOUT

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

// TOKEN

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  //USUARIO

  getUsuario(): Usuario | null {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  getNombreUsuario(): string {
    return this.getUsuario()?.nombre_completo || '';
  }

  // ROLES

  getRoles(): string[] {
    return this.getUsuario()?.roles || [];
  }

  tieneRol(rol: string): boolean {
    return this.getRoles().includes(rol);
  }

  tieneAlgunRol(roles: string[]): boolean {
    return roles.some(r => this.getRoles().includes(r));
  }

  //Decodificar token

  getPayload(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error al decodificar token', error);
      return null;
    }
  }
}
