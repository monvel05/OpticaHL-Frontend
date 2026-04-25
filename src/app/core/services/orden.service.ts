// src/app/core/services/orden.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  // Obtener órdenes 
  obtenerOrdenes(filtros?: any): Observable<any> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
      if (filtros.estatus) params = params.set('estatus', filtros.estatus);
      if (filtros.paciente_id) params = params.set('paciente_id', filtros.paciente_id);
    }
    return this.http.get<any>(this.apiUrl, { params });
  }

  crearOrden(ordenData: any): Observable<any> {
    return this.http.post(this.apiUrl, ordenData);
  }

  modificarOrden(orderId: number, updateData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderId}`, updateData);
  }

  registrarPago(orderId: number, pagoData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${orderId}/pay`, pagoData);
  }

  cancelarOrden(orderId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${orderId}/cancel`, {});
  }
}