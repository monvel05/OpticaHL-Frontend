import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env';

export interface Marca {
  id_marca: number;
  nombre: string;
  id_proveedor?: number | null;
  proveedor_nombre?: string;
  descripcion?: string | null;
  activo: boolean | number;
  fecha_creacion?: string;
  total_articulos?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MarcaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/marcas`;

  /**
   * Obtener marcas filtradas
   */
  obtenerMarcas(filtros?: { activo?: string; id_proveedor?: number; busqueda?: string }): Observable<Marca[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.activo !== undefined && filtros.activo !== 'all') {
        params = params.set('activo', filtros.activo);
      }
      if (filtros.id_proveedor !== undefined && filtros.id_proveedor !== 0) {
        params = params.set('id_proveedor', filtros.id_proveedor.toString());
      }
      if (filtros.busqueda && filtros.busqueda.trim() !== '') {
        params = params.set('busqueda', filtros.busqueda.trim());
      }
    }

    return this.http.get<{ success: boolean; datos: Marca[] }>(this.apiUrl, { params }).pipe(
      map(res => res.success ? (res.datos || []) : [])
    );
  }

  /**
   * Crear nueva marca asociada a un proveedor
   */
  crearMarca(payload: { nombre: string; id_proveedor?: number | null; descripcion?: string }): Observable<any> {
    return this.http.post<{ success: boolean; message: string; datos: Marca }>(this.apiUrl, payload);
  }

  /**
   * Actualizar marca existente
   */
  actualizarMarca(id: number, payload: Partial<Marca>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * Desactivar marca
   */
  eliminarMarca(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
