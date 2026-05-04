import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticulosService {

  private api = 'http://localhost:3000/api/articulos';

  private articulos$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {}

  // =====================
  // CRUD
  // =====================

  getArticulos() {
    return this.http.get<any[]>(this.api);
  }

  getServicios() {
    return this.http.get<any[]>(`${this.api}/servicios`);
  }

  crearArticulo(data: any) {
    return this.http.post(this.api, data);
  }

  actualizarArticulo(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  eliminarArticulo(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  // =====================
  // Validación
  // =====================

  validarCodigo(codigo: string) {
    return this.http.get<any>(`${this.api}/codigo/${codigo}`);
  }

  // =====================
  // Estado reactivo
  // =====================

  cargarArticulos() {
    this.getArticulos().subscribe(data => {
      this.articulos$.next(data);
    });
  }

  getArticulosStream() {
    return this.articulos$.asObservable();
  }
}
