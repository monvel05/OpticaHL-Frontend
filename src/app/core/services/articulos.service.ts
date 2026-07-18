import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticulosService {

  // Ajustado a singular /articulo para coincidir exactamente con tu backend
  private api = 'http://localhost:3000/api/articulos';

  private articulos$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {}

  // =====================
  // CRUD & Consultas HTTP
  // =====================

  // Ahora recibe los parámetros opcionales y los añade dinámicamente a la URL (?page=1&limit=20&q=...)
  getArticulos(page: number = 1, limit: number = 20, termino: string = '') {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (termino.trim() !== '') {
      params = params.set('q', termino.trim());
    }

    return this.http.get<any>(this.api, { params });
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

  // Modificado a PUT /id/desactivar para que use el Soft Delete que Mónica programó en tu backend
  eliminarArticulo(id: number) {
    return this.http.put(`${this.api}/${id}/desactivar`, {});
  }

  // =====================
  // Validación
  // =====================

  validarCodigo(codigo: string) {
    return this.http.get<any>(`${this.api}/codigo/${codigo}`);
  }

  // =====================
  // Estado reactivo (Stream)
  // =====================

  cargarArticulos(page: number = 1, limit: number = 20, termino: string = '') {
    this.getArticulos(page, limit, termino).subscribe({
      next: (res: any) => {
        // Extraemos el array desde res.data
        const nuevosArticulos = res?.data || [];
        
        if (page === 1) {
          // Carga inicial o búsqueda limpia -> sobrescribe el estado
          this.articulos$.next(nuevosArticulos);
        } else {
          // Scroll infinito -> concatena los nuevos artículos a la lista actual
          const actuales = this.articulos$.value;
          this.articulos$.next([...actuales, ...nuevosArticulos]);
        }
      },
      error: (err) => console.error('Error al cargar artículos en el servicio:', err)
    });
  }

  getArticulosStream() {
    return this.articulos$.asObservable();
  }
}