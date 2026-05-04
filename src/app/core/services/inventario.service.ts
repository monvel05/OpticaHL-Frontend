import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
// Importamos el environment para que funcione en desarrollo y producción
import { environment } from '../../../environment/envs'; 

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  // 1. Usamos la URL del environment
  private API_URL = `${environment.apiUrl}/articulos`;

  // 2. Estado reactivo para el inventario
  private inventario$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {}

  // =====================
  // LECTURA (GET)
  // =====================

  /** Obtiene todos los productos */
  getInventario(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  /** Obtiene productos por sucursal específica */
  getPorSucursal(idSucursal: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/sucursal/${idSucursal}`);
  }

  // =====================
  // ESCRITURA (POST / PUT)
  // =====================

  /** Crea un nuevo producto y refresca el estado */
  crearProducto(producto: any): Observable<any> {
    return this.http.post<any>(this.API_URL, producto).pipe(
      tap(() => this.cargarInventario()) // Actualiza la lista automáticamente al crear
    );
  }

  /** Actualiza el stock de un producto */
  actualizarStock(data: any): Observable<any> {
    return this.http.put(`${this.API_URL}/stock`, data).pipe(
      tap(() => this.cargarInventario()) // Actualiza la lista tras el cambio
    );
  }

  // =====================
  // GESTIÓN DE ESTADO (RxJS)
  // =====================

  /** * Carga el inventario desde el servidor y lo emite al BehaviorSubject 
   */
  cargarInventario() {
    this.getInventario().subscribe({
      next: (data) => this.inventario$.next(data),
      error: (err) => console.error('Error cargando inventario', err)
    });
  }

  /** * Retorna el Observable para que los componentes se suscriban a cambios en tiempo real 
   */
  inventarioStream(): Observable<any[]> {
    return this.inventario$.asObservable();
  }
}