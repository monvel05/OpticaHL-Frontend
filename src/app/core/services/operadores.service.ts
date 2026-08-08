import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environment/envs';

export interface Operador {
  id_operador?: number;
  nombre_completo: string;
  usuario_login: string;
  password?: string;
  id_sucursal: number;
  nombre_sucursal?: string;
  activo: boolean;
  descripcion?: string;
  roles?: string[];
}

export interface FiltrosOperador {
  activo?: string; // 'all' | 'true' | 'false'
  id_sucursal?: number | string;
  rol?: string;
  busqueda?: string;
}

export interface CatalogosOperador {
  roles: { id_rol: number; nombre_rol: string }[];
  sucursales: { id_sucursal: number; nombre: string }[];
}

export interface RespuestaApi<T = any> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
}

@Injectable({
  providedIn: 'root'
})
export class OperadoresService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/operadores`;

  private mockCatalogos: CatalogosOperador = {
    roles: [
      { id_rol: 1, nombre_rol: 'ADMINISTRADOR' },
      { id_rol: 2, nombre_rol: 'MOSTRADOR' },
      { id_rol: 3, nombre_rol: 'CAJER@' },
      { id_rol: 4, nombre_rol: 'INVENTARIO' },
      { id_rol: 5, nombre_rol: 'OPTOMETRISTA' },
      { id_rol: 6, nombre_rol: 'FACTURADOR@' }
    ],
    sucursales: [
      { id_sucursal: 1, nombre: 'Sucursal Matriz Centro' },
      { id_sucursal: 2, nombre: 'Sucursal Plaza Norte' },
      { id_sucursal: 3, nombre: 'Sucursal Galerías Sur' },
      { id_sucursal: 4, nombre: 'Sucursal Este Mirador' }
    ]
  };

  private mockOperadores: Operador[] = [
    {
      id_operador: 1,
      nombre_completo: 'Carlos Eduardo Gómez',
      usuario_login: 'admin.cgomez',
      id_sucursal: 1,
      nombre_sucursal: 'Sucursal Matriz Centro',
      activo: true,
      descripcion: 'Administrador General de Operaciones',
      roles: ['ADMINISTRADOR', 'MOSTRADOR']
    },
    {
      id_operador: 2,
      nombre_completo: 'Mariana López Fernández',
      usuario_login: 'mlopez.mostrador',
      id_sucursal: 1,
      nombre_sucursal: 'Sucursal Matriz Centro',
      activo: true,
      descripcion: 'Vendedora de Mostrador Senior',
      roles: ['MOSTRADOR']
    },
    {
      id_operador: 3,
      nombre_completo: 'Dr. Alejandro Ruiz Vaca',
      usuario_login: 'dr.aruiz',
      id_sucursal: 1,
      nombre_sucursal: 'Sucursal Matriz Centro',
      activo: true,
      descripcion: 'Optometrista Clínico Titular',
      roles: ['OPTOMETRISTA']
    },
    {
      id_operador: 4,
      nombre_completo: 'Ana Belén Martínez',
      usuario_login: 'amartinez.caja',
      id_sucursal: 2,
      nombre_sucursal: 'Sucursal Plaza Norte',
      activo: true,
      descripcion: 'Cajera Principal',
      roles: ['CAJER@']
    },
    {
      id_operador: 5,
      nombre_completo: 'Roberto Silva Hernández',
      usuario_login: 'rsilva.inv',
      id_sucursal: 3,
      nombre_sucursal: 'Sucursal Galerías Sur',
      activo: false,
      descripcion: 'Gestor de Almacén e Inventario',
      roles: ['INVENTARIO']
    },
    {
      id_operador: 6,
      nombre_completo: 'Dra. Laura Mendoza Solís',
      usuario_login: 'dra.lmendoza',
      id_sucursal: 2,
      nombre_sucursal: 'Sucursal Plaza Norte',
      activo: true,
      descripcion: 'Optometrista Especialista en Lentes de Contacto',
      roles: ['OPTOMETRISTA']
    }
  ];

  /**
   * Obtiene catálogos de roles y sucursales disponibles
   */
  obtenerCatalogos(): Observable<CatalogosOperador> {
    return this.http.get<RespuestaApi<CatalogosOperador>>(`${this.apiUrl}/catalogos`).pipe(
      map(res => (res && res.datos && res.datos.roles && res.datos.roles.length > 0) ? res.datos : this.mockCatalogos),
      catchError(() => of(this.mockCatalogos))
    );
  }

  /**
   * Obtiene operadores aplicando los filtros seleccionados
   */
  obtenerOperadores(filtros?: FiltrosOperador): Observable<Operador[]> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.activo !== undefined && filtros.activo !== 'all') params = params.set('activo', filtros.activo);
      if (filtros.id_sucursal && filtros.id_sucursal !== 0 && filtros.id_sucursal !== 'all') params = params.set('id_sucursal', filtros.id_sucursal.toString());
      if (filtros.rol && filtros.rol !== 'all') params = params.set('rol', filtros.rol);
      if (filtros.busqueda && filtros.busqueda.trim() !== '') params = params.set('busqueda', filtros.busqueda.trim());
    }

    return this.http.get<{ exito?: boolean; datos?: Operador[] } | Operador[]>(this.apiUrl, { params }).pipe(
      map(res => {
        let list: Operador[] = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res && res.datos && Array.isArray(res.datos)) {
          list = res.datos;
        }

        if (list.length === 0 && !filtros?.busqueda) {
          list = this.filtrarMock(filtros);
        }
        return list;
      }),
      catchError(() => of(this.filtrarMock(filtros)))
    );
  }

  /**
   * Obtiene detalles de un operador por ID
   */
  obtenerOperadorPorId(id: number): Observable<Operador> {
    return this.http.get<RespuestaApi<Operador>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.datos || this.mockOperadores.find(o => o.id_operador === id)!),
      catchError(() => of(this.mockOperadores.find(o => o.id_operador === id)!))
    );
  }

  /**
   * Registra un nuevo operador
   */
  crearOperador(operador: Operador): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(this.apiUrl, operador).pipe(
      catchError((err) => of({ exito: false, mensaje: err.error?.mensaje || 'Error de conexión al crear operador.' }))
    );
  }

  /**
   * Actualiza datos de un operador existente
   */
  actualizarOperador(id: number, operador: Partial<Operador>): Observable<RespuestaApi> {
    return this.http.put<RespuestaApi>(`${this.apiUrl}/${id}`, operador).pipe(
      catchError((err) => of({ exito: false, mensaje: err.error?.mensaje || 'Error de conexión al actualizar operador.' }))
    );
  }

  /**
   * Cambia estatus activo/inactivo
   */
  cambiarEstadoOperador(id: number, activo: boolean): Observable<RespuestaApi> {
    return this.http.patch<RespuestaApi>(`${this.apiUrl}/${id}/estado`, { activo }).pipe(
      catchError((err) => of({ exito: false, mensaje: err.error?.mensaje || 'Error al cambiar estatus.' }))
    );
  }

  /**
   * Actualiza la contraseña de un operador
   */
  cambiarPassword(id: number, nuevoPassword: string): Observable<RespuestaApi> {
    return this.http.patch<RespuestaApi>(`${this.apiUrl}/${id}/password`, { nueva_password: nuevoPassword, password: nuevoPassword }).pipe(
      catchError((err) => of({ exito: false, mensaje: err.error?.mensaje || 'Error al cambiar contraseña.' }))
    );
  }

  private filtrarMock(filtros?: FiltrosOperador): Operador[] {
    let result = [...this.mockOperadores];
    if (!filtros) return result;

    if (filtros.activo && filtros.activo !== 'all') {
      const act = filtros.activo === 'true' || filtros.activo === '1';
      result = result.filter(o => o.activo === act);
    }

    if (filtros.id_sucursal && filtros.id_sucursal !== 0 && filtros.id_sucursal !== 'all') {
      result = result.filter(o => o.id_sucursal === Number(filtros.id_sucursal));
    }

    if (filtros.rol && filtros.rol !== 'all') {
      result = result.filter(o => o.roles?.includes(filtros.rol!));
    }

    if (filtros.busqueda && filtros.busqueda.trim() !== '') {
      const q = filtros.busqueda.toLowerCase().trim();
      result = result.filter(o => 
        o.nombre_completo.toLowerCase().includes(q) || 
        o.usuario_login.toLowerCase().includes(q)
      );
    }
    return result;
  }
}