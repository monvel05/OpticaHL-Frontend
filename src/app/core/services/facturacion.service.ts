import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/envs';

export interface DatosFacturacion {
  folio_orden: string;
  uso_cfdi: string;
  regimen_fiscal: string;
  metodo_pago: string;
  forma_pago: string;
  id_sucursal: number;
  id_operador: number;
}

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/facturacion`; 

  /**
   * Envía los datos para timbrar una nueva factura (CFDI 4.0) ante el SAT
   */
  generarFactura(datos: DatosFacturacion): Observable<any> {
    return this.http.post(`${this.apiUrl}/timbrar`, datos);
  }

  /**
   * Obtiene la lista de facturas generadas (soporta filtros por fecha o cliente)
   */
  obtenerFacturas(filtros?: { fecha_inicio?: string; fecha_fin?: string; id_cliente?: number }): Observable<any> {
    let params = new HttpParams();
    if (filtros?.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    if (filtros?.id_cliente) params = params.set('id_cliente', filtros.id_cliente);

    return this.http.get(`${this.apiUrl}`, { params });
  }

  /**
   * Cancela una factura existente en el SAT
   */
  cancelarFactura(numFactura: string, motivo: string, uuidSustitucion?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${numFactura}/cancelar`, { 
      motivo, 
      uuid_sustitucion: uuidSustitucion 
    });
  }

  /**
   * Fuerza la descarga del XML abriendo la ruta del backend en una nueva pestaña
   */
  descargarXML(numFactura: string): void {
    window.open(`${this.apiUrl}/${numFactura}/xml`, '_blank');
  }
}