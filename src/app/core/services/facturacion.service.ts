import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/envs';

export interface ConceptoFactura {
  id_articulo?: number | string;
  noIdentificacion?: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  precioPublico?: number;
  claveProdServ: string;
  claveUnidad: string;
  descuento?: number;
  objImp?: string;
}

export interface ClienteFacturacion {
  id_cliente?: number;
  nombre?: string;
  razon_social?: string;
  rfc: string;
  email?: string;
  cp: string;
  domicilio?: string;
  regimen_fiscal?: string;
}

export interface DatosFacturacion {
  folio_orden?: string;
  folios_orden?: string[];
  uso_cfdi: string;
  regimen_fiscal: string;
  metodo_pago: string;
  forma_pago: string;
  serie?: string;
  id_sucursal?: string | number;
  id_operador?: number;
  cliente_custom?: ClienteFacturacion;
  conceptos_custom?: ConceptoFactura[];
}

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/facturacion`; 

  /**
   * Obtiene la lista de órdenes disponibles para facturación
   */
  obtenerOrdenesDisponibles(busqueda?: string): Observable<any> {
    let params = new HttpParams();
    if (busqueda) params = params.set('busqueda', busqueda);
    return this.http.get(`${this.apiUrl}/ordenes-disponibles`, { params });
  }

  /**
   * Obtiene los detalles consolidados de uno o varios folios de orden
   */
  obtenerDetallesOrdenes(folios: string[]): Observable<any> {
    const params = new HttpParams().set('folios', folios.join(','));
    return this.http.get(`${this.apiUrl}/ordenes-detalles`, { params });
  }

  /**
   * Envía los datos para timbrar una nueva factura (CFDI 4.0) ante el SAT
   */
  generarFactura(datos: DatosFacturacion): Observable<any> {
    return this.http.post(`${this.apiUrl}/timbrar`, datos);
  }

  /**
   * Obtiene la lista de facturas generadas (soporta filtros por búsqueda, fecha, estatus o cliente)
   */
  obtenerFacturas(filtros?: { fecha_inicio?: string; fecha_fin?: string; id_cliente?: number; busqueda?: string; estatus?: string }): Observable<any> {
    let params = new HttpParams();
    if (filtros?.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    if (filtros?.id_cliente) params = params.set('id_cliente', filtros.id_cliente);
    if (filtros?.busqueda) params = params.set('busqueda', filtros.busqueda);
    if (filtros?.estatus) params = params.set('estatus', filtros.estatus);

    return this.http.get(`${this.apiUrl}/obtenerFacturas`, { params });
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
   * Descarga el archivo XML de la factura autenticándose mediante la sesión activa
   */
  descargarXML(numFactura: string): void {
    const token = localStorage.getItem('token') || '';
    this.http.get(`${this.apiUrl}/${numFactura}/xml`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const fileUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `${numFactura}.xml`;
        a.click();
        URL.revokeObjectURL(fileUrl);
      },
      error: () => {
        // Fallback por ventana con token en query
        window.open(`${this.apiUrl}/${numFactura}/xml?token=${token}`, '_blank');
      }
    });
  }

  /**
   * Descarga/Abre el archivo PDF de la factura autenticándose mediante la sesión activa
   */
  descargarPDF(numFactura: string): void {
    const token = localStorage.getItem('token') || '';
    this.http.get(`${this.apiUrl}/${numFactura}/pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const fileUrl = URL.createObjectURL(blob);
        window.open(fileUrl, '_blank');
      },
      error: () => {
        // Fallback por ventana con token en query
        window.open(`${this.apiUrl}/${numFactura}/pdf?token=${token}`, '_blank');
      }
    });
  }
}