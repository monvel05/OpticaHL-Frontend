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
   * 1. Buscar clientes por término (Mostrador y Gabinete)
   */
  buscarClientes(termino: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar?q=${termino}`);
  }

  /**
   * 2. Registrar un nuevo cliente en SQL (Formulario de alta)
   */
  crearCliente(cliente: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, cliente);
  }

  /**
   * 3. Obtener la lista completa de clientes
   */
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  /**
   * 4. Obtener historial clínico del paciente
   */
  obtenerHistorial(idCliente: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idCliente}/historial`);
  }

  /**
   * 5. Guardar una nueva refracción / receta clínica
   */
  guardarNuevaRX(idCliente: number | string, datosRx: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${idCliente}/rx`, datosRx);
  }

  /**
   * 6. Obtener la última receta de un paciente para clonar/editar
   * 🎯 CORREGIDO: Se removió el prefijo '/clientes' duplicado
   */
  obtenerUltimaRX(clienteId: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clienteId}/ultima-rx`);
  }
}