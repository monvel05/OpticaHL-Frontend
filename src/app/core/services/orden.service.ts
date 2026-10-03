import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/envs';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  private http = inject(HttpClient);
  // 🎯 Ruta base al backend en español: /api/ordenes
  private apiUrl = `${environment.apiUrl}/ordenes`;

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

  /** Obtener el detalle de una orden por su Folio de Óptica */
  obtenerOrdenPorFolio(folio: string) {
    return this.http.get(`${this.apiUrl}/caja/orden/${folio}`);
  }

  // =====================
  // IMPRESIÓN / DESCARGA PDF
  // =====================

  /** 
   * Descarga y abre la Nota de Venta / Orden de Trabajo en PDF
   * enviando el operador detectado correctamente
   */
  descargarTicketPDF(folio: string): void {
  // 🔍 DEBUGEAR EN CONSOLA:
  console.log('--- DEBUG LOCALSTORAGE ---');
  console.log('usuario:', localStorage.getItem('usuario'));
  console.log('user:', localStorage.getItem('user'));
  console.log('token/jwt:', localStorage.getItem('token'));
  console.log('---------------------------');

  const userStorage = localStorage.getItem('usuario') || localStorage.getItem('user') || '{}';
  let usuarioData: any = {};

  try {
    usuarioData = JSON.parse(userStorage);
  } catch (e) {
    usuarioData = {};
  }

  // Buscamos en todas las propiedades posibles que suele devolver el backend
  const nombreOperador =
    usuarioData.nombre ||
    usuarioData.nombre_completo ||
    usuarioData.username ||
    usuarioData.nombreUsuario ||
    usuarioData.email ||
    localStorage.getItem('nombre') ||
    '';

  console.log('Nombre detectado para enviar:', nombreOperador);

  const operadorParam = encodeURIComponent(nombreOperador);
  const folioParam = encodeURIComponent(folio);

  const urlPdf = `${this.apiUrl}/pdf/${folioParam}?operador=${operadorParam}`;

  window.open(urlPdf, '_blank');
}

  // =====================
  // ACCIONES (POST / PUT)
  // =====================

  /** 
   * Crear una nueva orden de óptica desde el Mostrador
   */
  crearOrden(ordenData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, ordenData);
  }

  /** Modificar datos de una orden existente */
  modificarOrden(orderId: number | string, updateData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}`, updateData);
  }

  /** Registrar un abono o pago a la orden */
  registrarPago(orderId: number | string, pagoData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${orderId}/pay`, pagoData);
  }

  /** Cancelar una orden */
  cancelarOrden(orderId: number | string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${orderId}/cancel`, {});
  }
}