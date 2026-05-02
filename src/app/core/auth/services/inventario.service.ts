import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private api = 'http://localhost:3000/api/inventario';

  private inventario$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {}

  // =====================
  // GET
  // =====================

  getInventario() {
    return this.http.get<any[]>(this.api);
  }

  getPorSucursal(idSucursal: string) {
    return this.http.get<any[]>(`${this.api}/sucursal/${idSucursal}`);
  }

  // =====================
  // UPDATE
  // =====================

  actualizarStock(data: any) {
    return this.http.put(`${this.api}/stock`, data);
  }

  // =====================
  // Estado
  // =====================

  cargarInventario() {
    this.getInventario().subscribe(data => {
      this.inventario$.next(data);
    });
  }

  inventarioStream() {
    return this.inventario$.asObservable();
  }
}
