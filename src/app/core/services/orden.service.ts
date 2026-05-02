import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/envs';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  // =====================
  // CONSULTAS (GET)
  // =====================

  /** Obtener órdenes con filtros opcionales (fecha, estatus, paciente) */
  obtenerOrdenes(filtros?: any): Observable<any[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
      if (filtros.estatus) params = params.set('estatus', filtros.estatus);
      if (filtros.paciente_id) params = params.set('paciente_id', filtros.paciente_id);
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  /** Obtener el detalle de una orden específica por ID o Folio */
  getDetalle(idOrFolio: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${idOrFolio}`);
  }

  // =====================
  // ACCIONES (POST / PUT)
  // =====================

  /** Crear una nueva orden de óptica */
  crearOrden(ordenData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, ordenData);
  }

  /** Modificar datos de una orden existente */
  modificarOrden(orderId: number, updateData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}`, updateData);
  }

  /** Registrar un abono o pago a la orden */
  registrarPago(orderId: number, pagoData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${orderId}/pay`, pagoData);
  }

  /** * Cancelar una orden 
   * Nota: Unificado para usar el endpoint /cancel del backend profesional 
   */
  cancelarOrden(orderId: number | string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${orderId}/cancel`, {});
  }
}