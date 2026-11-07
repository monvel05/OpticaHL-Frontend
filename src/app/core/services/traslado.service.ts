import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';

export interface StockSucursalItem {
  id_sucursal: string;
  nombre_sucursal: string;
  telefono?: string;
  stock: number;
}

export interface ArticuloUniversal {
  id_articulo: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio_venta: number;
  costo: number;
  marca?: string;
  color?: string;
  material?: string;
  stock_total: number;
  sucursales_stock: { [id_sucursal: string]: StockSucursalItem };
}

export interface SolicitudTraslado {
  id_solicitud: number;
  folio: string;
  id_articulo: number;
  codigo_articulo: string;
  nombre_articulo: string;
  precio_venta: number;
  id_sucursal_origen: string;
  sucursal_origen: string;
  telefono_origen?: string;
  id_sucursal_destino: string;
  sucursal_destino: string;
  telefono_destino?: string;
  cantidad: number;
  estatus: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'RECIBIDA';
  motivo?: string;
  fecha_solicitud: string;
  fecha_autorizacion?: string;
  fecha_recepcion?: string;
  operador_solicita?: string;
  operador_autoriza?: string;
}

export interface FichaSalidaData {
  id_solicitud: number;
  folio: string;
  cantidad: number;
  estatus: string;
  motivo?: string;
  fecha_solicitud: string;
  fecha_autorizacion: string;
  id_articulo: number;
  codigo: string;
  nombre: string;
  precio_venta: number;
  marca?: string;
  color?: string;
  material?: string;
  sucursal_origen_id: string;
  sucursal_origen_nombre: string;
  sucursal_origen_direccion?: string;
  sucursal_origen_telefono?: string;
  sucursal_destino_id: string;
  sucursal_destino_nombre: string;
  sucursal_destino_direccion?: string;
  sucursal_destino_telefono?: string;
  operador_solicita?: string;
  operador_autoriza?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrasladoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/inventario`;

  /**
   * Búsqueda universal de artículos y disponibilidad de stock en todas las sucursales
   */
  buscarUniversal(query: string = ''): Observable<{ success: boolean; sucursales: any[]; data: ArticuloUniversal[] }> {
    return this.http.get<{ success: boolean; sucursales: any[]; data: ArticuloUniversal[] }>(
      `${this.apiUrl}/buscador-universal`,
      { params: { q: query } }
    );
  }

  /**
   * Crear solicitud de traspaso hacia otra sucursal
   */
  crearSolicitud(payload: {
    id_articulo: number;
    id_sucursal_origen: string;
    id_sucursal_destino: string;
    cantidad: number;
    motivo?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitudes-traslado`, payload);
  }

  /**
   * Consultar solicitudes de traslado
   */
  obtenerSolicitudes(idSucursal?: string, estatus?: string): Observable<{ success: boolean; data: SolicitudTraslado[] }> {
    const params: any = {};
    if (idSucursal && idSucursal !== '0' && idSucursal !== 'TODAS') {
      params.id_sucursal = idSucursal;
    }
    if (estatus && estatus !== 'TODOS') {
      params.estatus = estatus;
    }
    return this.http.get<{ success: boolean; data: SolicitudTraslado[] }>(
      `${this.apiUrl}/solicitudes-traslado`,
      { params }
    );
  }

  /**
   * Responder a una solicitud (ACEPTAR descontando stock origen o RECHAZAR)
   */
  responderSolicitud(idSolicitud: number, accion: 'ACEPTAR' | 'RECHAZAR'): Observable<any> {
    return this.http.put(`${this.apiUrl}/solicitudes-traslado/${idSolicitud}/responder`, { accion });
  }

  /**
   * Confirmar recepción del producto en la sucursal destino
   */
  recibirSolicitud(idSolicitud: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/solicitudes-traslado/${idSolicitud}/recibir`, {});
  }

  /**
   * Obtener datos detallados para la Ficha de Salida
   */
  obtenerFichaSalida(idSolicitud: number | string): Observable<{ success: boolean; data: FichaSalidaData }> {
    return this.http.get<{ success: boolean; data: FichaSalidaData }>(
      `${this.apiUrl}/solicitudes-traslado/${idSolicitud}/ficha-salida`
    );
  }
}
