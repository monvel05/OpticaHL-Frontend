import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// 1. Importamos el environment
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  // 2. Construimos la URL usando la base del environment
  private API_URL = `${environment.apiUrl}/articulos`;

  constructor(private http: HttpClient) { }

  getInventario(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  crearProducto(producto: any): Observable<any> {
    return this.http.post<any>(this.API_URL, producto);
  }
}