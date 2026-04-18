import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences'; // Para guardar el token
import { environment } from '../../../environment/environment'; // Importamos la configuración

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // Usamos la URL que definimos en el archivo environment
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  /**
   * Realiza la petición de login al backend
   * @param credentials { usuario, password, sucursal_actual }
   */
  login(credentials: any): Observable<any> {
    // Esto conectará a: http://localhost:3000/api/auth/login
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // --- MÉTODOS PARA MANEJAR EL TOKEN (Capacitor Preferences) ---

  async setToken(token: string) {
    await Preferences.set({
      key: 'token',
      value: token
    });
  }

  async getToken() {
    const { value } = await Preferences.get({ key: 'token' });
    return value;
  }

  /**
   * Limpia los datos de sesión al cerrar
   */
  async logout() {
    await Preferences.remove({ key: 'token' });
    localStorage.clear(); 
    // Si guardaste el usuario o sucursal en Preferences, podrías borrarlos aquí también
  }
}