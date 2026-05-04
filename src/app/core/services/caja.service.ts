import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  private api = 'http://localhost:3000/api/caja';

  constructor(private http: HttpClient) {}

  getMovimientos() {
    return this.http.get<any[]>(this.api);
  }

  registrarMovimiento(data: any) {
    return this.http.post(this.api, data);
  }

  getCorteCaja() {
    return this.http.get<any>(`${this.api}/corte`);
  }
}
