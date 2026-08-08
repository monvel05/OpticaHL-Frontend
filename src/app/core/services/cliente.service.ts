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
  buscarClientes(termino: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/buscar?q=${termino}`);
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
  getClientes(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  /**
   * 4. Obtener historial completo (Clínico + Materiales) del paciente
   * 🎯 ACTUALIZADO: Devuelve { success: true, data: { clinico: [...], materiales: [...] } }
   */
  obtenerHistorial(idCliente: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${idCliente}/historial`);
  }

  /**
   * 5. Guardar una nueva refracción / receta clínica
   */
  guardarNuevaRX(idCliente: number | string, datosRx: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${idCliente}/rx`, datosRx);
  }

  /**
   * 6. Obtener la última receta de un paciente para clonar/editar
   */
  obtenerUltimaRX(clienteId: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${clienteId}/ultima-rx`);
  }
  // ✅ CORRECTO
actualizarCliente(idCliente: number, datos: any): Observable<any> {
  // Si tu 'this.apiUrl' ya incluye la palabra '/clientes' (ej. http://localhost:3000/api/clientes):
  return this.http.put(`${this.apiUrl}/${idCliente}`, datos);
}
}