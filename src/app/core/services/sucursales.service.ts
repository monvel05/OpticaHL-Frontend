import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environment/envs';

export interface Sucursal {
  id_sucursal: string;
  nombre: string;
  direccion?: string;
  activo: boolean;
}

export interface FiltrosSucursal {
  activo?: string; // 'all' | 'true' | 'false'
  busqueda?: string;
}

export interface RespuestaApi<T = any> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
  desactivado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sucursales`;

  // Sucursales mock de respaldo en caso de desconexión temporal de la API
  private mockSucursales: Sucursal[] = [
    { id_sucursal: 'HL01', nombre: 'Matriz Hospital de Lentes', direccion: 'Centro, Calvillo', activo: true },
    { id_sucursal: 'HL02', nombre: 'Sucursal Norte', direccion: 'Plaza Principal, Calvillo', activo: true }
  ];

  /**
   * Obtiene la lista de sucursales filtrada por los criterios especificados
   */
  obtenerSucursales(filtros?: FiltrosSucursal): Observable<Sucursal[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.activo && filtros.activo !== 'all') {
        params = params.set('activo', filtros.activo);
      }
      if (filtros.busqueda && filtros.busqueda.trim() !== '') {
        params = params.set('busqueda', filtros.busqueda.trim());
      }
    }

    return this.http.get<RespuestaApi<Sucursal[]>>(this.apiUrl, { params }).pipe(
      map(res => res.exito ? res.datos || [] : []),
      catchError(err => {
        console.warn('Fallback a datos locales de sucursales debido a un error de red:', err);
        let filtradas = [...this.mockSucursales];
        if (filtros) {
          if (filtros.activo === 'true') {
            filtradas = filtradas.filter(s => s.activo);
          } else if (filtros.activo === 'false') {
            filtradas = filtradas.filter(s => !s.activo);
          }
          if (filtros.busqueda) {
            const q = filtros.busqueda.toLowerCase();
            filtradas = filtradas.filter(s => 
              s.id_sucursal.toLowerCase().includes(q) || 
              s.nombre.toLowerCase().includes(q) ||
              (s.direccion && s.direccion.toLowerCase().includes(q))
            );
          }
        }
        return of(filtradas);
      })
    );
  }

  /**
   * Obtiene los datos detallados de una sucursal por su ID
   */
  obtenerSucursalPorId(id: string): Observable<Sucursal | null> {
    return this.http.get<RespuestaApi<Sucursal>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.exito ? res.datos || null : null),
      catchError(() => {
        const encontrada = this.mockSucursales.find(s => s.id_sucursal === id) || null;
        return of(encontrada);
      })
    );
  }

  /**
   * Crea una nueva sucursal en el sistema
   */
  crearSucursal(sucursal: Sucursal): Observable<RespuestaApi<Sucursal>> {
    return this.http.post<RespuestaApi<Sucursal>>(this.apiUrl, sucursal).pipe(
      catchError(err => of({
        exito: false,
        mensaje: err.error?.mensaje || 'Error al registrar la sucursal.'
      }))
    );
  }

  /**
   * Actualiza los datos de una sucursal existente
   */
  actualizarSucursal(id: string, sucursal: Partial<Sucursal>): Observable<RespuestaApi<Sucursal>> {
    return this.http.put<RespuestaApi<Sucursal>>(`${this.apiUrl}/${id}`, sucursal).pipe(
      catchError(err => of({
        exito: false,
        mensaje: err.error?.mensaje || 'Error al actualizar la sucursal.'
      }))
    );
  }

  /**
   * Cambia el estado activo/inactivo de una sucursal
   */
  cambiarEstadoSucursal(id: string, activo: boolean): Observable<RespuestaApi> {
    return this.http.patch<RespuestaApi>(`${this.apiUrl}/${id}/estado`, { activo }).pipe(
      catchError(err => of({
        exito: false,
        mensaje: err.error?.mensaje || 'Error al cambiar estado de la sucursal.'
      }))
    );
  }

  /**
   * Elimina o desactiva una sucursal por su ID
   */
  eliminarSucursal(id: string): Observable<RespuestaApi> {
    return this.http.delete<RespuestaApi>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => of({
        exito: false,
        mensaje: err.error?.mensaje || 'Error al eliminar la sucursal.'
      }))
    );
  }
}
