import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private API_URL = 'http://localhost:3000/api/inventario';

  constructor(private http: HttpClient) { }

  getInventario(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }
}