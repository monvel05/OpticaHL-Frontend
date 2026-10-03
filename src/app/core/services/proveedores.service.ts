import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private api = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) {}

  getProveedores() {
    return this.http.get<any[]>(this.api);
  }

  crearProveedor(data: any) {
    return this.http.post(this.api, data);
  }

  actualizarProveedor(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  eliminarProveedor(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}
