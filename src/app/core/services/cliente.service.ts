import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Cliente } from 'src/app/shared/interfaces/cliente.interface';


@Injectable({
  providedIn: 'root'
})

export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clientes`;

  crearCliente(cliente: Cliente): Observable<any> {
    return this.http.post(this.apiUrl, cliente);
  }

  buscarClientes(termino: string): Observable<Cliente[]> {
    const params = new HttpParams().set('q', termino);
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar`, { params });
  }

  obtenerHistorial(idCliente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${idCliente}/historial`);
  }
}