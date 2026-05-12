import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators'; // Importamos map para los filtros
import { environment } from '../../../environment/envs'; 

// Definición de Interfaz (Movida arriba para mejor legibilidad)
// En src/app/core/services/inventario.service.ts
export interface Producto {
  id: any;
  nombre: string;
  marca: string;      // <--- Asegúrate de que diga 'marca'
  cantidad: number;   // <--- Cambia 'stockActual' por 'cantidad' para que coincida con tu HTML
  stockMinimo: number;
  tipo: string; 
  stockActual: number;
  // <--- Cambia 'categoria' por 'tipo' para que coincida con tu HTML
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private API_URL = `${environment.apiUrl}/articulos`;
  private inventario$ = new BehaviorSubject<Producto[]>([]);

  constructor(private http: HttpClient) {}

  // =====================
  // LECTURA (GET)
  // =====================

  /** Obtiene todos los productos */
  getInventario(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.API_URL);
  }

  /** * REGLA DE NEGOCIO: Obtiene solo productos en stock crítico
   * Filtra los productos donde el stock actual es menor o igual al mínimo
   */
  getStockCritico(): Observable<Producto[]> {
    return this.getInventario().pipe(
      map(productos => productos.filter(p => p.stockActual <= p.stockMinimo))
    );
  }

  /** Obtiene productos por sucursal específica */
  getPorSucursal(idSucursal: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.API_URL}/sucursal/${idSucursal}`);
  }

  // =====================
  // ESCRITURA (POST / PUT)
  // =====================

  /** Crea un nuevo producto y refresca el estado */
  crearProducto(producto: any): Observable<any> {
    return this.http.post<any>(this.API_URL, producto).pipe(
      tap(() => this.cargarInventario()) 
    );
  }

  /** Actualiza el stock de un producto */
  actualizarStock(data: any): Observable<any> {
    return this.http.put(`${this.API_URL}/stock`, data).pipe(
      tap(() => this.cargarInventario())
    );
  }

  // =====================
  // GESTIÓN DE ESTADO (RxJS)
  // =====================

  /** Carga el inventario desde el servidor y lo emite al BehaviorSubject */
  cargarInventario() {
    this.getInventario().subscribe({
      next: (data) => this.inventario$.next(data),
      error: (err) => console.error('Error cargando inventario', err)
    });
  }

  /** Retorna el Observable para suscripción en tiempo real */
  inventarioStream(): Observable<Producto[]> {
    return this.inventario$.asObservable();
  }
}