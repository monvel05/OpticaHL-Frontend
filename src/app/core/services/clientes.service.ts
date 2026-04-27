import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private apiUrl = `${environment.apiUrl}/clientes`; // Verifica que en tu backend sea /api/clientes

  constructor(private http: HttpClient) { }

  crearCliente(cliente: any): Observable<any> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const payload = {
      ...cliente,
      creado_por: user.id_operador || null
    };
    return this.http.post(this.apiUrl, payload);
  }
  getClientes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}