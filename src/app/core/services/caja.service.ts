import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private api = 'http://localhost:3000/api/caja';

  /**
   * Helper para adjuntar el token JWT en las cabeceras HTTP
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * 1. Obtener la lista de movimientos de caja
   */
  getMovimientos(): Observable<any[]> {
    return this.http.get<any[]>(this.api, { headers: this.getHeaders() });
  }

  /**
   * 2. Registrar un nuevo movimiento en caja (Ingreso / Egreso / Cobro Rápido)
   */
  registrarMovimiento(data: any): Observable<any> {
    return this.http.post<any>(this.api, data, { headers: this.getHeaders() });
  }

  /**
   * 3. Obtener el corte de caja actual
   */
  getCorteCaja(): Observable<any> {
    return this.http.get<any>(`${this.api}/corte`, { headers: this.getHeaders() });
  }

  /**
   * 4. Obtener datos de una orden específica para realizar cobro
   */
  obtenerOrdenParaCobro(folio: string): Observable<any> {
    return this.http.get<any>(`${this.api}/orden/${folio.trim()}`, { headers: this.getHeaders() });
  }

  /**
   * 5. Buscar productos en inventario por código o nombre
   */
  buscarProductosInventario(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/inventario?search=${encodeURIComponent(termino)}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * 6. Descargar el ticket PDF de una orden por su folio
   */
  descargarTicketPDF(folio: string): Observable<Blob> {
    return this.http.get(`${this.api}/ticket/${folio.trim()}`, {
      responseType: 'blob',
      headers: this.getHeaders()
    });
  }

  /**
   * 7. Descargar Ticket PDF para Venta Exprés / Mostrador (Autenticado vía HttpClient)
   */
  descargarTicketVentaExpresPDF(concepto: string, monto: number, metodoPago: string): Observable<Blob> {
    const url = `${this.api}/ticket-expres/pdf?concepto=${encodeURIComponent(concepto)}&monto=${monto}&metodo_pago=${encodeURIComponent(metodoPago)}`;
    return this.http.get(url, {
      responseType: 'blob',
      headers: this.getHeaders()
    });
  }

  /**
   * 8. Descargar el PDF del corte de caja
   */
  descargarTicketCortePDF(): Observable<Blob> {
    return this.http.get(`${this.api}/corte/pdf`, {
      responseType: 'blob',
      headers: this.getHeaders()
    });
  }
}