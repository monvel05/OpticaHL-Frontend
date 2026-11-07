import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Proveedor {
  id_proveedor?: number;
  tipo_cliente: 'Persona' | 'Negocio';
  razon_social: string;
  domicilio?: string;
  colonia?: string;
  localidad?: string;
  estado?: string;
  cp?: string;
  lada?: string;
  tel_negocio?: string;
  ext?: string;
  fax?: string;
  email?: string;
  responsable?: string;
  telefono_responsable?: string;
  celular?: string;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {
  private API = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ==================== PROVEEDORES ====================

  getProveedores(query: string = '', buscarPor: string = 'NOMBRE'): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.API}/proveedores?q=${query}&buscarPor=${buscarPor}`);
  }

  guardarProveedor(proveedor: Proveedor): Observable<any> {
    if (proveedor.id_proveedor) {
      return this.http.put(`${this.API}/proveedores/${proveedor.id_proveedor}`, proveedor);
    }
    return this.http.post(`${this.API}/proveedores`, proveedor);
  }

  // ==================== COMPRAS Y VALES ====================

  guardarCompra(compra: any, items: any[]): Observable<any> {
    return this.http.post(`${this.API}/proveedores/compras`, { compra, items });
  }

  guardarVale(vale: any, detalles: any[]): Observable<any> {
    return this.http.post(`${this.API}/proveedores/vales`, { vale, detalles });
  }

  // ==================== IMPRESIÓN ZEBRA ====================

  // Imprimir lote completo de etiquetas al registrar una compra
  imprimirEtiquetasZebra(items: any[], nombreImpresora: string = 'ZebraDesigner'): Observable<any> {
    return this.http.post(`${this.API}/proveedores/imprimir-etiquetas`, {
      items,
      nombreImpresora
    });
  }

  // Reimprimir etiquetas de un artículo individual por su código o ID
  reimprimirEtiqueta(codigo: string, cantidad: number = 1, nombreImpresora: string = 'ZebraDesigner'): Observable<any> {
    return this.http.post(`${this.API}/proveedores/reimprimir-etiqueta`, {
      codigo,
      cantidad,
      nombreImpresora
    });
  }
}