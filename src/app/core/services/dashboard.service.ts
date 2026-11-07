import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '@env';

export interface SucursalVenta {
  idSucursal: string | number;
  nombre: string;
  montoTotal: number;
  numTransacciones: number;
  porcentaje: number;
  color: string;
}

export interface ProductoRotacion {
  idArticulo: number;
  codigo: string;
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  totalVentas: number;
  stockActual: number;
  sucursalId?: string | number;
}

export interface ProductoBajaRotacion {
  idArticulo: number;
  codigo: string;
  nombre: string;
  categoria: string;
  sucursal: string;
  sucursalId: string | number;
  stockActual: number;
  diasEstancado: number;
  unidadesVendidasPeriodo: number;
  precioUnitario: number;
  capitalEstancado: number;
  nivelRiesgo: 'CRITICO' | 'ALTO' | 'MEDIO';
  accionSugerida: string;
}

export interface HistoricoFinanciero {
  periodoEtiqueta: string;
  proyectado: number;
  real: number;
  gananciaBruta: number;
  gananciaNeta: number;
}

export interface MetricasFinancieras {
  periodo: string; // 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANUAL' | 'TODO'
  ingresoReal: number;
  ingresoProyectado: number;
  gananciaBruta: number;
  margenBrutoPorcentaje: number;
  gananciaNeta: number;
  margenNetoPorcentaje: number;
  gastosOperativos: number;
  cumplimientoMetaPorcentaje: number;
  historico: HistoricoFinanciero[];
}

export interface ProductividadOperador {
  idOperador: number;
  nombre: string;
  sucursal: string;
  sucursalId: string | number;
  rol: 'MOSTRADOR' | 'OPTOMETRISTA';
  ventasCerradasMonto: number;
  ventasCerradasCantidad: number;
  ticketPromedio: number;
  refraccionesCompletadas: number;
  foto?: string;
}

export interface FiltrosDashboard {
  idSucursal: string | number; // '0' = Todas, 'HL01', 'HL02', etc.
  rangoTiempo: 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANUAL' | 'TODO' | 'HISTORICO' | 'PERSONALIZADO';
  fechaInicio?: string;
  fechaFin?: string;
}

export interface VentaReporte {
  folio: string;
  fecha_emision: string | Date;
  cliente: string;
  estatus: string;
  total_orden: number;
  total_pagado: number;
}

export interface DescuentoReporte {
  num_factura?: string;
  folio_orden?: string;
  fecha: string | Date;
  cliente: string;
  subtotal: number;
  descuento: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reporte`;

  private colorPalette = ['#3880ff', '#3dc2ff', '#52de97', '#ffc409', '#7044ff', '#eb445a'];

  getSucursalesCatalog(): Observable<{ id: string | number; nombre: string }[]> {
    return this.http.get<{ exito: boolean; datos: { id: string | number; nombre: string }[] }>(`${this.apiUrl}/sucursales`).pipe(
      map(res => {
        if (res.exito && res.datos && res.datos.length > 0) {
          return [{ id: '0', nombre: 'Todas las Sucursales' }, ...res.datos];
        }
        return [
          { id: '0', nombre: 'Todas las Sucursales' },
          { id: 'HL01', nombre: 'Matriz Hospital de Lentes' },
          { id: 'HL02', nombre: 'Sucursal Norte' }
        ];
      }),
      catchError(() => of([
        { id: '0', nombre: 'Todas las Sucursales' },
        { id: 'HL01', nombre: 'Matriz Hospital de Lentes' },
        { id: 'HL02', nombre: 'Sucursal Norte' }
      ]))
    );
  }

  // 1. Distribución Comercial Multisucursal desde DB
  getDistribucionMultisucursal(filtros: FiltrosDashboard): Observable<SucursalVenta[]> {
    return this.http.get<{ exito: boolean; datos: any[] }>(`${this.apiUrl}/dashboard-multisucursal`, {
      params: { 
        id_sucursal: filtros.idSucursal ? filtros.idSucursal.toString() : '0', 
        rangoTiempo: filtros.rangoTiempo,
        fechaInicio: filtros.fechaInicio || '',
        fechaFin: filtros.fechaFin || ''
      }
    }).pipe(
      map(res => {
        if (res.exito && res.datos && res.datos.length > 0) {
          const totalGral = res.datos.reduce((sum, d) => sum + Number(d.montoTotal || 0), 0);
          return res.datos.map((d, idx) => ({
            idSucursal: d.idSucursal,
            nombre: d.nombre,
            montoTotal: Number(d.montoTotal || 0),
            numTransacciones: Number(d.numTransacciones || 0),
            porcentaje: totalGral > 0 ? Number(((Number(d.montoTotal || 0) / totalGral) * 100).toFixed(1)) : 0,
            color: this.colorPalette[idx % this.colorPalette.length]
          }));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  // 2. Top 10 Productos desde DB
  getTopProductosRotacion(filtros: FiltrosDashboard): Observable<ProductoRotacion[]> {
    return this.http.get<{ exito: boolean; datos: any[] }>(`${this.apiUrl}/dashboard-top-productos`, {
      params: { 
        id_sucursal: filtros.idSucursal ? filtros.idSucursal.toString() : '0', 
        rangoTiempo: filtros.rangoTiempo,
        fechaInicio: filtros.fechaInicio || '',
        fechaFin: filtros.fechaFin || ''
      }
    }).pipe(
      map(res => {
        if (res.exito && res.datos && res.datos.length > 0) {
          return res.datos.map(p => ({
            idArticulo: p.idArticulo,
            codigo: p.codigo,
            nombre: p.nombre,
            categoria: p.categoria,
            unidadesVendidas: Number(p.unidadesVendidas || 0),
            totalVentas: Number(p.totalVentas || 0),
            stockActual: Number(p.stockActual || 0)
          }));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  // 3. Productos Baja Rotación desde DB
  getProductosBajaRotacion(filtros: FiltrosDashboard): Observable<ProductoBajaRotacion[]> {
    return this.http.get<{ exito: boolean; datos: any[] }>(`${this.apiUrl}/dashboard-baja-rotacion`, {
      params: { id_sucursal: filtros.idSucursal ? filtros.idSucursal.toString() : '0' }
    }).pipe(
      map(res => {
        if (res.exito && res.datos && res.datos.length > 0) {
          return res.datos.map(p => ({
            idArticulo: p.idArticulo,
            codigo: p.codigo,
            nombre: p.nombre,
            categoria: p.categoria,
            sucursal: p.sucursal || 'Matriz',
            sucursalId: p.sucursalId || 'HL01',
            stockActual: Number(p.stockActual || 0),
            diasEstancado: Number(p.diasEstancado || 90),
            unidadesVendidasPeriodo: Number(p.unidadesVendidasPeriodo || 0),
            precioUnitario: Number(p.precioUnitario || 0),
            capitalEstancado: Number(p.capitalEstancado || 0),
            nivelRiesgo: p.nivelRiesgo || 'MEDIO',
            accionSugerida: p.accionSugerida || 'Exhibir en mostrador'
          }));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  // 4. Métricas Financieras desde DB
  getMetricasFinancieras(filtros: FiltrosDashboard): Observable<MetricasFinancieras> {
    return this.http.get<{ exito: boolean; datos: MetricasFinancieras }>(`${this.apiUrl}/dashboard-metricas-financieras`, {
      params: { 
        id_sucursal: filtros.idSucursal ? filtros.idSucursal.toString() : '0', 
        rangoTiempo: filtros.rangoTiempo,
        fechaInicio: filtros.fechaInicio || '',
        fechaFin: filtros.fechaFin || ''
      }
    }).pipe(
      map(res => {
        if (res.exito && res.datos) {
          return res.datos;
        }
        return {
          periodo: filtros.rangoTiempo,
          ingresoReal: 0,
          ingresoProyectado: 0,
          gananciaBruta: 0,
          margenBrutoPorcentaje: 0,
          gananciaNeta: 0,
          margenNetoPorcentaje: 0,
          gastosOperativos: 0,
          cumplimientoMetaPorcentaje: 0,
          historico: []
        };
      }),
      catchError(() => of({
        periodo: filtros.rangoTiempo,
        ingresoReal: 0,
        ingresoProyectado: 0,
        gananciaBruta: 0,
        margenBrutoPorcentaje: 0,
        gananciaNeta: 0,
        margenNetoPorcentaje: 0,
        gastosOperativos: 0,
        cumplimientoMetaPorcentaje: 0,
        historico: []
      }))
    );
  }

  // 5. Productividad de Personal desde DB
  getProductividadPersonal(filtros: FiltrosDashboard): Observable<{
    mostrador: ProductividadOperador[];
    optometristas: ProductividadOperador[];
  }> {
    return this.http.get<{ exito: boolean; datos: { mostrador: any[]; optometristas: any[] } }>(`${this.apiUrl}/dashboard-productividad-personal`, {
      params: { 
        id_sucursal: filtros.idSucursal ? filtros.idSucursal.toString() : '0', 
        rangoTiempo: filtros.rangoTiempo,
        fechaInicio: filtros.fechaInicio || '',
        fechaFin: filtros.fechaFin || ''
      }
    }).pipe(
      map(res => {
        if (res.exito && res.datos) {
          return {
            mostrador: (res.datos.mostrador || []).map(m => ({
              idOperador: m.idOperador,
              nombre: m.nombre,
              sucursal: m.sucursal || 'Matriz',
              sucursalId: m.sucursalId || 'HL01',
              rol: 'MOSTRADOR' as const,
              ventasCerradasMonto: Number(m.ventasCerradasMonto || 0),
              ventasCerradasCantidad: Number(m.ventasCerradasCantidad || 0),
              ticketPromedio: Number(m.ticketPromedio || 0),
              refraccionesCompletadas: 0
            })),
            optometristas: (res.datos.optometristas || []).map(o => ({
              idOperador: o.idOperador,
              nombre: o.nombre,
              sucursal: o.sucursal || 'Matriz',
              sucursalId: o.sucursalId || 'HL01',
              rol: 'OPTOMETRISTA' as const,
              ventasCerradasMonto: 0,
              ventasCerradasCantidad: 0,
              ticketPromedio: 0,
              refraccionesCompletadas: Number(o.refraccionesCompletadas || 0)
            }))
          };
        }
        return { mostrador: [], optometristas: [] };
      }),
      catchError(() => of({ mostrador: [], optometristas: [] }))
    );
  }

  // 6. Reportes de Ventas Completo
  getReporteVentasCompleto(fechaInicio?: string, fechaFin?: string): Observable<VentaReporte[]> {
    let params: any = {};
    if (fechaInicio && fechaFin) {
      params.fechaInicio = fechaInicio;
      params.fechaFin = fechaFin;
    }
    return this.http.get<{ exito: boolean; datos: VentaReporte[] }>(`${this.apiUrl}/ventas-completo`, { params }).pipe(
      map(res => res.exito && res.datos ? res.datos : []),
      catchError(() => of([]))
    );
  }

  // 7. Reportes de Descuentos
  getReporteDescuentos(mes?: number, anio?: number): Observable<DescuentoReporte[]> {
    const hoy = new Date();
    const params = {
      mes: (mes || hoy.getMonth() + 1).toString(),
      anio: (anio || hoy.getFullYear()).toString()
    };
    return this.http.get<{ exito: boolean; datos: DescuentoReporte[] }>(`${this.apiUrl}/descuentos-mensuales`, { params }).pipe(
      map(res => res.exito && res.datos ? res.datos : []),
      catchError(() => of([]))
    );
  }
}
