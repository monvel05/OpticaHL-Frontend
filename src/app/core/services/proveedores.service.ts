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

  getProveedores(query: string = '', buscarPor: string = 'NOMBRE'): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.API}/proveedores?q=${query}&buscarPor=${buscarPor}`);
  }

  guardarProveedor(proveedor: Proveedor): Observable<any> {
    if (proveedor.id_proveedor) {
      return this.http.put(`${this.API}/proveedores/${proveedor.id_proveedor}`, proveedor);
    }
    return this.http.post(`${this.API}/proveedores`, proveedor);
  }

  // src/app/shared/services/proveedores.service.ts

  guardarCompra(compra: any, items: any[]): Observable<any> {
    return this.http.post(`${this.API}/proveedores/compras`, { compra, items });
  }

  guardarVale(vale: any, detalles: any[]): Observable<any> {
    return this.http.post(`${this.API}/vales`, { vale, detalles });
  }
}