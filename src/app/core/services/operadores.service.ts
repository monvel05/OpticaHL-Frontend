import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/envs';

// 1. Interfaz alineada con el modelo relacional de la BD
export interface Operador {
  id_operador?: number; // Opcional al crear uno nuevo
  nombre_completo: string;
  usuario_login: string;
  password?: string; // Solo se envía en creación o cambio de contraseña
  id_sucursal: number;
  activo: boolean;
  roles?: string[]; // Array de roles asignados al operador
}

export interface RespuestaApi {
  exito: boolean;
  mensaje: string;
  datos?: any;
}

@Injectable({
  providedIn: 'root'
})
export class OperadoresService {
  // Inyección moderna de dependencias
  private http = inject(HttpClient);
  
  // Ruta base del endpoint en el backend (Express.js)
  private apiUrl = `${environment.apiUrl}/api/operadores`;

  /**
   * Obtiene la lista completa de operadores registrados en el sistema.
   * @returns Observable con el arreglo de operadores.
   */
  obtenerOperadores(): Observable<Operador[]> {
    return this.http.get<Operador[]>(this.apiUrl);
  }

  /**
   * Obtiene los detalles de un operador específico por su ID.
   * @param id Identificador único del operador.
   */
  obtenerOperadorPorId(id: number): Observable<Operador> {
    return this.http.get<Operador>(`${this.apiUrl}/${id}`);
  }

  /**
   * Registra un nuevo operador en la base de datos.
   * @param operador Objeto con los datos del nuevo operador (incluyendo password).
   */
  crearOperador(operador: Operador): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(this.apiUrl, operador);
  }

  /**
   * Actualiza la información general de un operador existente.
   * @param id Identificador único del operador.
   * @param operador Objeto con los datos actualizados.
   */
  actualizarOperador(id: number, operador: Partial<Operador>): Observable<RespuestaApi> {
    return this.http.put<RespuestaApi>(`${this.apiUrl}/${id}`, operador);
  }

  /**
   * Cambia el estatus de un operador (Activo / Inactivo).
   * Sustituye la eliminación física para mantener la integridad referencial en órdenes y facturas.
   * @param id Identificador único del operador.
   * @param activo Estado booleano a asignar.
   */
  cambiarEstadoOperador(id: number, activo: boolean): Observable<RespuestaApi> {
    return this.http.patch<RespuestaApi>(`${this.apiUrl}/${id}/estado`, { activo });
  }

  /**
   * Actualiza únicamente la contraseña de un operador.
   * @param id Identificador único del operador.
   * @param nuevoPassword La nueva contraseña en texto plano (el backend debe hashearla).
   */
  cambiarPassword(id: number, nuevoPassword: string): Observable<RespuestaApi> {
    return this.http.patch<RespuestaApi>(`${this.apiUrl}/${id}/password`, { password: nuevoPassword });
  }
}