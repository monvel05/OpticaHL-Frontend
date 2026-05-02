import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/envs'; // Ruta corregida según errores previos
import { Cliente } from '../../shared/interfaces/cliente.interface';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clientes`;

  // =====================
  // CONSULTAS (GET)
  // =====================

  /** Obtener todos los clientes */
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  /** Buscar clientes por término (nombre, teléfono, etc.) */
  buscarClientes(termino: string): Observable<Cliente[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar`, { params });
  }

  /** Obtener el historial de compras/consultas de un cliente */
  obtenerHistorial(idCliente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idCliente}/historial`);
  }

  // =====================
  // ACCIONES (POST)
  // =====================

  /** Crear un nuevo cliente vinculando quién lo registró */
  crearCliente(cliente: Cliente): Observable<any> {
    // Intentamos obtener el usuario desde localStorage (respaldo del AuthService)
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    
    const payload = {
      ...cliente,
      creado_por: user.id_operador || null,
    };
    
    return this.http.post<any>(this.apiUrl, payload);
  }
}