import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Promocion {
  id_promocion?: number;
  nombre: string;
  descripcion?: string;
  porcentaje_descuento: number;
  tipo_aplicacion: 'TODOS' | 'CATEGORIA' | 'PRODUCTO';
  id_articulo?: number | null;
  articulo_nombre?: string;
  categoria?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  activo?: number;
  estado_actual?: 'VIGENTE' | 'PROGRAMADO' | 'VENCIDO' | 'PAUSADO';
}

@Injectable({
  providedIn: 'root'
})
export class DescuentoService {
  private http = inject(HttpClient);
  private api = 'http://localhost:3000/api/descuentos';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  obtenerDescuentos(): Observable<any> {
    return this.http.get<any>(this.api, { headers: this.getHeaders() });
  }

  obtenerDescuentosVigentes(): Observable<any> {
    return this.http.get<any>(`${this.api}/vigentes`, { headers: this.getHeaders() });
  }

  crearDescuento(data: Partial<Promocion>): Observable<any> {
    return this.http.post<any>(this.api, data, { headers: this.getHeaders() });
  }

  cambiarEstado(id: number): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}/toggle`, {}, { headers: this.getHeaders() });
  }

  eliminarDescuento(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`, { headers: this.getHeaders() });
  }
}

// Exportamos también como DescuentosService por compatibilidad
export { DescuentoService as DescuentosService };