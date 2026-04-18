import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  // ✅ Cambiamos la URL a 'articulos' que es donde tienes el GET y el POST principales
  private API_URL = 'http://localhost:3000/api/articulos';

  constructor(private http: HttpClient) { }

  // Obtener la lista de productos (GET)
  getInventario(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  // ✅ Añadimos esta función para que el botón "Guardar" de tu modal funcione
  crearProducto(producto: any): Observable<any> {
    return this.http.post<any>(this.API_URL, producto);
  }
}