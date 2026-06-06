import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environment/envs';

// Interfaz mapeada al 100% con la base de datos
export interface Articulo {
  id_articulo?: number;
  codigo: string;
  nombre: string;
  categoria: 'ARMAZON' | 'LENTE_CONTACTO' | 'ACCESORIO' | 'SERVICIO'; // Formato unificado
  id_proveedor?: number;
  nombre_proveedor?: string;
  costo: number;          
  precio_venta: number;   
  activo?: number;
  // Propiedades detalladas
  marca?: string;
  color?: string;
  material?: string;
  estilo?: string;
  puente?: string;
  diagonal?: string;
  base?: string;
  // Propiedades de inventario por sucursal
  stock_actual: number;
  stock_minimo: number;
  ubicacion_estante?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private http = inject(HttpClient);
  private URL_ARTICULOS = `${environment.apiUrl}/articulos`;
  private URL_INVENTARIO = `${environment.apiUrl}/inventario`;

  // Estado compartido para la sincronización multi-sucursal en tiempo real
  private articulos$ = new BehaviorSubject<Articulo[]>([]);

  constructor() {
    // Inicializa la carga de datos apuntando por defecto a la Sucursal Matriz (HL01)
    this.cargarArticulos('HL01');
  }

  // ==========================================
  // SINCRO EN TIEMPO REAL (BehaviorSubject)
  // ==========================================

  /** * Carga todos los artículos activos desde el nuevo endpoint general de inventario 
   * filtrado por la sucursal activa.
   */
  cargarArticulos(idSucursal: string = 'HL01'): void {
    // Conecta directo al endpoint '/api/inventario/general?id_sucursal=HLXX'
    const url = `${this.URL_INVENTARIO}/general?id_sucursal=${idSucursal}`;
    
    this.http.get<{ success: boolean; data: Articulo[] }>(url).subscribe({
      next: (res) => {
        if (res.success) {
          this.articulos$.next(res.data);
        }
      },
      error: (err) => console.error('Error cargando artículos de la API:', err)
    });
  }

  /** Expone el stream para actualización automática de las pantallas */
  getArticulosStream(): Observable<Articulo[]> {
    return this.articulos$.asObservable();
  }

  // ==========================================
  // FILTROS Y REGLAS (Juan y Mariana)
  // ==========================================

  /** MARIANA: Consulta rápida de inventario (Excluye servicios) */
  getProductosFisicos(): Observable<Articulo[]> {
    return this.getArticulosStream().pipe(
      map(lista => lista.filter(a => a.categoria !== 'SERVICIO'))
    );
  }

  /** JUAN: Flujo de Servicios (Exámenes de la vista, reparaciones) */
  getServicios(): Observable<Articulo[]> {
    return this.getArticulosStream().pipe(
      map(lista => lista.filter(a => a.categoria === 'SERVICIO'))
    );
  }

  /** MARIANA: Alertas de stock crítico (Usa el endpoint de tu compañera) */
  obtenerAlertasStock(): Observable<Articulo[]> {
    return this.http.get<{ success: boolean; data: Articulo[] }>(`${this.URL_INVENTARIO}/alertas`).pipe(
      map(res => res.data)
    );
  }

  // ==========================================
  // OPERACIONES (POST, PUT, DELETE)
  // ==========================================

  /** Crea un nuevo artículo/servicio y refresca el estado instantáneamente */
  crearArticulo(articulo: any): Observable<any> {
    return this.http.post<any>(this.URL_ARTICULOS, articulo).pipe(
      tap(() => this.cargarArticulos()) // Sincroniza de inmediato la vista
    );
  }

  /** Modifica los datos del artículo */
  actualizarArticulo(id: number, articulo: any): Observable<any> {
    return this.http.put<any>(`${this.URL_ARTICULOS}/${id}`, articulo).pipe(
      tap(() => this.cargarArticulos())
    );
  }

  /** Retira un producto del catálogo (Soft Delete) */
  desactivarArticulo(id: number): Observable<any> {
    return this.http.put<any>(`${this.URL_ARTICULOS}/${id}/desactivar`, {}).pipe(
      tap(() => this.cargarArticulos())
    );
  }

  /** Actualiza las existencias usando las rutas de inventarioController */
  actualizarStock(idArticulo: number, idSucursal: string, nuevoStock: number): Observable<any> {
    return this.http.put<any>(`${this.URL_INVENTARIO}/stock/${idArticulo}/${idSucursal}`, { nuevo_stock: nuevoStock }).pipe(
      tap(() => this.cargarArticulos())
    );
  }
}