import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../../shared/interfaces/cliente.interface';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/clientes';

  /**
   * 1. Buscar clientes por término (Nombre, Teléfono, etc.)
   */
  buscarClientes(termino: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/buscar?q=${encodeURIComponent(termino)}`);
  }

  /**
   * 2. Registrar un nuevo cliente
   */
  crearCliente(cliente: Partial<Cliente> | any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cliente);
  }

  /**
   * 3. Obtener la lista completa de clientes
   */
  getClientes(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  /**
   * 4. Actualizar los datos de un cliente existente
   */
  actualizarCliente(idCliente: number | string, datos: Partial<Cliente> | any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${idCliente}`, datos);
  }

  /**
   * 5. Eliminar un cliente por su ID
   */
  eliminarCliente(idCliente: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${idCliente}`);
  }

  /**
   * 6. Obtener el historial completo (Clínico + Materiales) de un paciente
   */
  obtenerHistorial(idCliente: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${idCliente}/historial`);
  }

  /**
   * 7. Guardar una nueva refracción / receta clínica
   */
  guardarNuevaRX(idCliente: number | string, datosRx: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${idCliente}/rx`, datosRx);
  }

  /**
   * 8. Obtener la última receta de un paciente para clonar/editar
   */
  obtenerUltimaRX(idCliente: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${idCliente}/ultima-rx`);
  }
}