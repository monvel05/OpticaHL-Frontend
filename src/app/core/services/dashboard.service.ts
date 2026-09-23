import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environment/envs';

export interface SucursalVenta {
  idSucursal: number;
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
  sucursalId?: number;
}

export interface ProductoBajaRotacion {
  idArticulo: number;
  codigo: string;
  nombre: string;
  categoria: string;
  sucursal: string;
  sucursalId: number;
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
  periodo: string; // 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANUAL'
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
  sucursalId: number;
  rol: 'MOSTRADOR' | 'OPTOMETRISTA';
  ventasCerradasMonto: number;
  ventasCerradasCantidad: number;
  ticketPromedio: number;
  refraccionesCompletadas: number;
  foto?: string;
}

export interface FiltrosDashboard {
  idSucursal: number; // 0 = Todas
  rangoTiempo: 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANUAL' | 'PERSONALIZADO';
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

  private sucursalesCatalog = [
    { id: 0, nombre: 'Todas las Sucursales' },
    { id: 1, nombre: 'Sucursal Matriz Centro' },
    { id: 2, nombre: 'Sucursal Plaza Norte' },
    { id: 3, nombre: 'Sucursal Galerías Sur' },
    { id: 4, nombre: 'Sucursal Este Mirador' }
  ];

  // Base fallback dataset para demostración visual impecable
  private distribucionSucursalesBase: SucursalVenta[] = [
    { idSucursal: 1, nombre: 'Sucursal Matriz Centro', montoTotal: 485900, numTransacciones: 342, porcentaje: 38.5, color: '#3880ff' },
    { idSucursal: 2, nombre: 'Sucursal Plaza Norte', montoTotal: 338400, numTransacciones: 245, porcentaje: 26.8, color: '#3dc2ff' },
    { idSucursal: 3, nombre: 'Sucursal Galerías Sur', montoTotal: 264100, numTransacciones: 188, porcentaje: 20.9, color: '#52de97' },
    { idSucursal: 4, nombre: 'Sucursal Este Mirador', montoTotal: 173600, numTransacciones: 119, porcentaje: 13.8, color: '#ffc409' }
  ];

  private productosTopBase: ProductoRotacion[] = [
    { idArticulo: 101, codigo: 'ARM-RAY-501', nombre: 'Ray-Ban Wayfarer Classic Black', categoria: 'Armazones', unidadesVendidas: 142, totalVentas: 355000, stockActual: 28, sucursalId: 1 },
    { idArticulo: 102, codigo: 'MIC-PRO-ANTI', nombre: 'Mica Policarbonato Antirreflejante HD', categoria: 'Micas', unidadesVendidas: 128, totalVentas: 192000, stockActual: 150, sucursalId: 1 },
    { idArticulo: 103, codigo: 'ARM-OAK-202', nombre: 'Oakley Holbrook Sapphire Iridium', categoria: 'Sol', unidadesVendidas: 115, totalVentas: 322000, stockActual: 19, sucursalId: 2 },
    { idArticulo: 104, codigo: 'LEN-ACU-OAS', nombre: 'Lentes de Contacto Acuvue Oasys Astigmatismo', categoria: 'Contacto', unidadesVendidas: 98, totalVentas: 137200, stockActual: 45, sucursalId: 3 },
    { idArticulo: 105, codigo: 'MIC-TRANS-GEN8', nombre: 'Mica Transitions Gen 8 Crizal Sapphire', categoria: 'Micas Specialized', unidadesVendidas: 87, totalVentas: 287100, stockActual: 60, sucursalId: 1 },
    { idArticulo: 106, codigo: 'ARM-VOG-304', nombre: 'Vogue Eyewear Cat-Eye Rose Gold', categoria: 'Armazones', unidadesVendidas: 76, totalVentas: 152000, stockActual: 14, sucursalId: 2 },
    { idArticulo: 107, codigo: 'SOL-CLEAN-KIT', nombre: 'Kit Limpiador Anti-empañante 60ml', categoria: 'Accesorios', unidadesVendidas: 74, totalVentas: 18500, stockActual: 210, sucursalId: 4 },
    { idArticulo: 108, codigo: 'ARM-GUCCI-88', nombre: 'Gucci Frame Oversized Black/Gold', categoria: 'Armazones Lujo', unidadesVendidas: 63, totalVentas: 302400, stockActual: 8, sucursalId: 3 },
    { idArticulo: 109, codigo: 'MIC-BLUE-BLOCK', nombre: 'Mica Monofocal Blue Filter UV420', categoria: 'Micas', unidadesVendidas: 59, totalVentas: 94400, stockActual: 82, sucursalId: 4 },
    { idArticulo: 110, codigo: 'LEN-AIR-OPTIX', nombre: 'Air Optix Night & Day Aqua 6pk', categoria: 'Contacto', unidadesVendidas: 52, totalVentas: 88400, stockActual: 32, sucursalId: 2 }
  ];

  private productosBajaRotacionBase: ProductoBajaRotacion[] = [
    {
      idArticulo: 201,
      codigo: 'ARM-RETRO-90',
      nombre: 'Armazón Vintage Metal Dorado XL',
      categoria: 'Armazones',
      sucursal: 'Sucursal Matriz Centro',
      sucursalId: 1,
      stockActual: 34,
      diasEstancado: 195,
      unidadesVendidasPeriodo: 0,
      precioUnitario: 1850,
      capitalEstancado: 62900,
      nivelRiesgo: 'CRITICO',
      accionSugerida: 'Liquidación 40% OFF o Remate'
    },
    {
      idArticulo: 202,
      codigo: 'SOL-SPORT-NEO',
      nombre: 'Lente Sol Deportivo Neón Polarizado',
      categoria: 'Sol',
      sucursal: 'Sucursal Plaza Norte',
      sucursalId: 2,
      stockActual: 27,
      diasEstancado: 160,
      unidadesVendidasPeriodo: 1,
      precioUnitario: 1200,
      capitalEstancado: 32400,
      nivelRiesgo: 'CRITICO',
      accionSugerida: 'Combo con estuche rígido gratis'
    },
    {
      idArticulo: 203,
      codigo: 'ACC-CORD-TIEN',
      nombre: 'Cordon Sujetador de Cadena Étnica',
      categoria: 'Accesorios',
      sucursal: 'Sucursal Este Mirador',
      sucursalId: 4,
      stockActual: 85,
      diasEstancado: 140,
      unidadesVendidasPeriodo: 2,
      precioUnitario: 220,
      capitalEstancado: 18700,
      nivelRiesgo: 'ALTO',
      accionSugerida: 'Regalo en compras mayores a $2,500'
    },
    {
      idArticulo: 204,
      codigo: 'LEN-COLOR-PUR',
      nombre: 'Lentes de Contacto Cosméticos Púrpura',
      categoria: 'Contacto',
      sucursal: 'Sucursal Galerías Sur',
      sucursalId: 3,
      stockActual: 18,
      diasEstancado: 110,
      unidadesVendidasPeriodo: 0,
      precioUnitario: 890,
      capitalEstancado: 16020,
      nivelRiesgo: 'ALTO',
      accionSugerida: 'Promoción 2x1 en graduados'
    },
    {
      idArticulo: 205,
      codigo: 'ARM-CHILD-BLU',
      nombre: 'Armazón Infantil Flexible Azul Rey',
      categoria: 'Armazones Niño',
      sucursal: 'Sucursal Plaza Norte',
      sucursalId: 2,
      stockActual: 22,
      diasEstancado: 95,
      unidadesVendidasPeriodo: 1,
      precioUnitario: 1450,
      capitalEstancado: 31900,
      nivelRiesgo: 'MEDIO',
      accionSugerida: 'Descuento Temporada Escolar 25%'
    },
    {
      idArticulo: 206,
      codigo: 'EST-CUERO-PREM',
      nombre: 'Estuche de Cuero Rigido Vintage',
      categoria: 'Accesorios',
      sucursal: 'Sucursal Matriz Centro',
      sucursalId: 1,
      stockActual: 40,
      diasEstancado: 85,
      unidadesVendidasPeriodo: 3,
      precioUnitario: 350,
      capitalEstancado: 14000,
      nivelRiesgo: 'MEDIO',
      accionSugerida: 'Exhibir en mostrador principal'
    }
  ];

  private operadoresBase: ProductividadOperador[] = [
    {
      idOperador: 1,
      nombre: 'Mariana López',
      sucursal: 'Sucursal Matriz Centro',
      sucursalId: 1,
      rol: 'MOSTRADOR',
      ventasCerradasMonto: 312500,
      ventasCerradasCantidad: 118,
      ticketPromedio: 2648,
      refraccionesCompletadas: 0
    },
    {
      idOperador: 2,
      nombre: 'Carlos Mendoza',
      sucursal: 'Sucursal Plaza Norte',
      sucursalId: 2,
      rol: 'MOSTRADOR',
      ventasCerradasMonto: 245800,
      ventasCerradasCantidad: 92,
      ticketPromedio: 2671,
      refraccionesCompletadas: 0
    },
    {
      idOperador: 3,
      nombre: 'Sofia Ramirez',
      sucursal: 'Sucursal Galerías Sur',
      sucursalId: 3,
      rol: 'MOSTRADOR',
      ventasCerradasMonto: 198400,
      ventasCerradasCantidad: 76,
      ticketPromedio: 2610,
      refraccionesCompletadas: 0
    },
    {
      idOperador: 4,
      nombre: 'Roberto Gomez',
      sucursal: 'Sucursal Este Mirador',
      sucursalId: 4,
      rol: 'MOSTRADOR',
      ventasCerradasMonto: 142300,
      ventasCerradasCantidad: 54,
      ticketPromedio: 2635,
      refraccionesCompletadas: 0
    },
    {
      idOperador: 5,
      nombre: 'Dr. Alejandro Ruiz',
      sucursal: 'Sucursal Matriz Centro',
      sucursalId: 1,
      rol: 'OPTOMETRISTA',
      ventasCerradasMonto: 0,
      ventasCerradasCantidad: 0,
      ticketPromedio: 0,
      refraccionesCompletadas: 164
    },
    {
      idOperador: 6,
      nombre: 'Dra. Laura Mendoza',
      sucursal: 'Sucursal Plaza Norte',
      sucursalId: 2,
      rol: 'OPTOMETRISTA',
      ventasCerradasMonto: 0,
      ventasCerradasCantidad: 0,
      ticketPromedio: 0,
      refraccionesCompletadas: 138
    },
    {
      idOperador: 7,
      nombre: 'Dr. Javier Torres',
      sucursal: 'Sucursal Galerías Sur',
      sucursalId: 3,
      rol: 'OPTOMETRISTA',
      ventasCerradasMonto: 0,
      ventasCerradasCantidad: 0,
      ticketPromedio: 0,
      refraccionesCompletadas: 105
    },
    {
      idOperador: 8,
      nombre: 'Dra. Elena Castillo',
      sucursal: 'Sucursal Este Mirador',
      sucursalId: 4,
      rol: 'OPTOMETRISTA',
      ventasCerradasMonto: 0,
      ventasCerradasCantidad: 0,
      ticketPromedio: 0,
      refraccionesCompletadas: 82
    }
  ];

  getSucursalesCatalog(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ exito: boolean; datos: { id: number; nombre: string }[] }>(`${this.apiUrl}/sucursales`).pipe(
      map(res => res.datos && res.datos.length > 0 ? [{ id: 0, nombre: 'Todas las Sucursales' }, ...res.datos] : this.sucursalesCatalog),
      catchError(() => of(this.sucursalesCatalog))
    );
  }

  // 1. Distribución Comercial Multisucursal desde DB
  getDistribucionMultisucursal(filtros: FiltrosDashboard): Observable<SucursalVenta[]> {
    return this.http.get<{ exito: boolean; datos: any[] }>(`${this.apiUrl}/dashboard-multisucursal`, {
      params: { 
        id_sucursal: filtros.idSucursal.toString(), 
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
        id_sucursal: filtros.idSucursal.toString(), 
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
      params: { id_sucursal: filtros.idSucursal.toString() }
    }).pipe(
      map(res => {
        if (res.exito && res.datos && res.datos.length > 0) {
          return res.datos.map(p => ({
            idArticulo: p.idArticulo,
            codigo: p.codigo,
            nombre: p.nombre,
            categoria: p.categoria,
            sucursal: p.sucursal || 'Sucursal Principal',
            sucursalId: p.sucursalId || 1,
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
        id_sucursal: filtros.idSucursal.toString(), 
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
        id_sucursal: filtros.idSucursal.toString(), 
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
              sucursalId: m.sucursalId || 1,
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
              sucursalId: o.sucursalId || 1,
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
