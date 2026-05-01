import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class OrdenesService {

  private api = 'http://localhost:3000/api/ordenes';

  constructor(private http: HttpClient) {}

  // =====================
  // CREAR ORDEN
  // =====================

  crearOrden(data: any) {
    return this.http.post(this.api, data);
  }

  // =====================
  // CONSULTAS
  // =====================

  getOrdenes() {
    return this.http.get<any[]>(this.api);
  }

  getDetalle(folio: string) {
    return this.http.get<any[]>(`${this.api}/${folio}`);
  }

  // =====================
  // CANCELAR
  // =====================

  cancelarOrden(folio: string) {
    return this.http.put(`${this.api}/cancelar/${folio}`, {});
  }
}
