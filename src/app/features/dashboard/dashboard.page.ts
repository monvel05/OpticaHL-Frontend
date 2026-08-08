import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';

import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonSelect, IonSelectOption,
  IonSegment, IonSegmentButton, IonBadge, IonChip, IonLabel,
  IonSpinner, IonRefresher, IonRefresherContent, IonMenuButton, IonItem, IonInput
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  pieChartOutline, barChartOutline, trendingUpOutline, alertCircleOutline,
  cashOutline, eyeOutline, peopleOutline, funnelOutline, calendarOutline,
  filterOutline, refreshOutline, downloadOutline, pricetagOutline,
  arrowUpOutline, arrowDownOutline, checkmarkCircleOutline, storefrontOutline,
  trophyOutline, sparklesOutline, cubeOutline, cartOutline, flashOutline,
  statsChartOutline, analyticsOutline, buildOutline, documentTextOutline,
  fileTrayFullOutline, printOutline
} from 'ionicons/icons';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import {
  DashboardService,
  SucursalVenta,
  ProductoRotacion,
  ProductoBajaRotacion,
  MetricasFinancieras,
  ProductividadOperador,
  FiltrosDashboard,
  VentaReporte,
  DescuentoReporte
} from '../../core/services/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    BaseChartDirective,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonSelect, IonSelectOption,
    IonSegment, IonSegmentButton, IonBadge, IonChip, IonLabel,
    IonSpinner, IonRefresher, IonRefresherContent, IonMenuButton
  ]
})
export class DashboardPage implements OnInit {

  @ViewChild(BaseChartDirective) chartDirective?: BaseChartDirective;

  // Pestaña principal activa: 'METRICAS' | 'REPORTES'
  public vistaPrincipal: 'METRICAS' | 'REPORTES' = 'METRICAS';

  // Estado de Filtros
  public filtros: FiltrosDashboard = {
    idSucursal: 0, // Todas
    rangoTiempo: 'MENSUAL',
    fechaInicio: '',
    fechaFin: ''
  };

  public sucursalesCatalog: { id: number; nombre: string }[] = [];
  public cargando = false;

  // 1. Datos Distribución Multisucursal
  public distribucionSucursales: SucursalVenta[] = [];
  public totalTransaccionesGral = 0;
  public totalMontoGral = 0;
  public pieChartType: ChartType = 'pie';
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { family: "'Segoe UI', sans-serif", size: 12 },
          padding: 14
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw as number;
            return ` $${val.toLocaleString('es-MX')} (${context.formattedValue})`;
          }
        }
      }
    }
  };
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  };

  // 2. Top 10 Productos Mayor Rotación
  public topProductos: ProductoRotacion[] = [];
  public barTopType: ChartType = 'bar';
  public barTopOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.raw} unidades sold`
        }
      }
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { grid: { display: false } }
    }
  };
  public barTopData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: '#3880ff', borderRadius: 6 }]
  };

  // 3. Productos Baja Rotación
  public productosBajaRotacion: ProductoBajaRotacion[] = [];
  public productosBajaRotacionFiltrados: ProductoBajaRotacion[] = [];
  public filtroRiesgo: string = 'TODOS';
  public capitalEstancadoTotal = 0;
  public itemsEstancadosTotal = 0;

  // 4. Métricas Financieras y Utilidades
  public metricasFinancieras!: MetricasFinancieras;
  public chartFinancieroType: ChartType = 'line';
  public chartFinancieroOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: $${Number(context.raw).toLocaleString('es-MX')}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => '$' + Number(value).toLocaleString('es-MX')
        }
      }
    }
  };
  public chartFinancieroData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  // 5. Productividad de Personal
  public productividadMostrador: ProductividadOperador[] = [];
  public productividadOptometristas: ProductividadOperador[] = [];
  public tabProductividad: 'MOSTRADOR' | 'OPTOMETRISTA' = 'MOSTRADOR';

  // Chart Mostrador
  public barMostradorType: ChartType = 'bar';
  public barMostradorOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };
  public barMostradorData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  // Chart Optometristas
  public barOptoType: ChartType = 'bar';
  public barOptoOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };
  public barOptoData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  // 6. Datos de Reportes Unificados
  public reporteVentas: VentaReporte[] = [];
  public reporteDescuentos: DescuentoReporte[] = [];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      pieChartOutline, barChartOutline, trendingUpOutline, alertCircleOutline,
      cashOutline, eyeOutline, peopleOutline, funnelOutline, calendarOutline,
      filterOutline, refreshOutline, downloadOutline, pricetagOutline,
      arrowUpOutline, arrowDownOutline, checkmarkCircleOutline, storefrontOutline,
      trophyOutline, sparklesOutline, cubeOutline, cartOutline, flashOutline,
      statsChartOutline, analyticsOutline, buildOutline, documentTextOutline,
      fileTrayFullOutline, printOutline
    });

    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);
    this.filtros.fechaInicio = haceUnMes.toISOString().split('T')[0];
    this.filtros.fechaFin = hoy.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.dashboardService.getSucursalesCatalog().subscribe(sucursales => {
      this.sucursalesCatalog = sucursales;
    });
    this.cargarDashboard();
  }

  public onSucursalChange(event: any) {
    this.filtros.idSucursal = Number(event.detail.value);
    this.cargarDashboard();
  }

  public onRangoTiempoChange(event: any) {
    this.filtros.rangoTiempo = event.detail.value;
    this.cargarDashboard();
  }

  public onFechasChange() {
    if (this.filtros.fechaInicio && this.filtros.fechaFin) {
      this.filtros.rangoTiempo = 'PERSONALIZADO';
      this.cargarDashboard();
    }
  }

  public doRefresh(event: any) {
    this.cargarDashboard(() => {
      event.target.complete();
    });
  }

  public cargarDashboard(callback?: () => void) {
    this.cargando = true;
    let pendientes = 7;

    const checkFinalizado = () => {
      pendientes--;
      if (pendientes <= 0) {
        this.cargando = false;
        this.cdr.markForCheck();
        if (callback) callback();
      }
    };

    // 1. Distribución Multisucursal
    this.dashboardService.getDistribucionMultisucursal(this.filtros).subscribe({
      next: (datos) => {
        this.distribucionSucursales = datos;
        this.totalMontoGral = datos.reduce((acc, curr) => acc + curr.montoTotal, 0);
        this.totalTransaccionesGral = datos.reduce((acc, curr) => acc + curr.numTransacciones, 0);

        this.pieChartData = {
          labels: datos.map(d => `${d.nombre} (${d.porcentaje}%)`),
          datasets: [{
            data: datos.map(d => d.montoTotal),
            backgroundColor: datos.map(d => d.color),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        };
        checkFinalizado();
      },
      error: () => checkFinalizado()
    });

    // 2. Top 10 Productos
    this.dashboardService.getTopProductosRotacion(this.filtros).subscribe({
      next: (top) => {
        this.topProductos = top;
        this.barTopData = {
          labels: top.map(p => p.nombre.length > 22 ? p.nombre.substring(0, 20) + '...' : p.nombre),
          datasets: [{
            label: 'Unidades Vendidas',
            data: top.map(p => p.unidadesVendidas),
            backgroundColor: 'rgba(56, 128, 255, 0.85)',
            borderColor: '#3880ff',
            borderWidth: 1,
            borderRadius: 6
          }]
        };
        checkFinalizado();
      },
      error: () => checkFinalizado()
    });

    // 3. Productos Baja Rotación
    this.dashboardService.getProductosBajaRotacion(this.filtros).subscribe({
      next: (baja) => {
        this.productosBajaRotacion = baja;
        this.capitalEstancadoTotal = baja.reduce((acc, curr) => acc + curr.capitalEstancado, 0);
        this.itemsEstancadosTotal = baja.reduce((acc, curr) => acc + curr.stockActual, 0);
        this.aplicarFiltroRiesgo(this.filtroRiesgo);
        checkFinalizado();
      },
      error: () => checkFinalizado()
    });

    // 4. Métricas Financieras
    this.dashboardService.getMetricasFinancieras(this.filtros).subscribe({
      next: (mf) => {
        this.metricasFinancieras = mf;
        const labels = mf.historico.map(h => h.periodoEtiqueta);
        this.chartFinancieroData = {
          labels,
          datasets: [
            {
              label: 'Ingreso Real ($)',
              data: mf.historico.map(h => h.real),
              borderColor: '#2dd36f',
              backgroundColor: 'rgba(45, 211, 111, 0.15)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Proyección ($)',
              data: mf.historico.map(h => h.proyectado),
              borderColor: '#92949c',
              borderDash: [5, 5],
              fill: false,
              tension: 0.1
            },
            {
              label: 'Ganancia Neta ($)',
              data: mf.historico.map(h => h.gananciaNeta),
              borderColor: '#3880ff',
              backgroundColor: 'rgba(56, 128, 255, 0.1)',
              fill: false,
              tension: 0.3
            }
          ]
        };
        checkFinalizado();
      },
      error: () => checkFinalizado()
    });

    // 5. Productividad Personal
    this.dashboardService.getProductividadPersonal(this.filtros).subscribe({
      next: (prod) => {
        this.productividadMostrador = prod.mostrador;
        this.productividadOptometristas = prod.optometristas;

        this.barMostradorData = {
          labels: prod.mostrador.map(m => m.nombre),
          datasets: [{
            label: 'Monto Ventas ($)',
            data: prod.mostrador.map(m => m.ventasCerradasMonto),
            backgroundColor: '#3880ff',
            borderRadius: 6
          }]
        };

        this.barOptoData = {
          labels: prod.optometristas.map(o => o.nombre),
          datasets: [{
            label: 'Exámenes / Refracciones',
            data: prod.optometristas.map(o => o.refraccionesCompletadas),
            backgroundColor: '#2dd36f',
            borderRadius: 6
          }]
        };
        checkFinalizado();
      },
      error: () => checkFinalizado()
    });

    // 6. Reporte de Ventas Completo
    this.dashboardService.getReporteVentasCompleto(this.filtros.fechaInicio, this.filtros.fechaFin).subscribe({
      next: (ventas) => {
        this.reporteVentas = ventas;
        checkFinalizado();
      },
      error: () => checkFinalizado()
    });

    // 7. Reporte de Descuentos
    this.dashboardService.getReporteDescuentos().subscribe({
      next: (descuentos) => {
        this.reporteDescuentos = descuentos;
        checkFinalizado();
      },
      error: () => checkFinalizado()
    });
  }

  public aplicarFiltroRiesgo(riesgo: string) {
    this.filtroRiesgo = riesgo;
    if (riesgo === 'TODOS') {
      this.productosBajaRotacionFiltrados = [...this.productosBajaRotacion];
    } else {
      this.productosBajaRotacionFiltrados = this.productosBajaRotacion.filter(p => p.nivelRiesgo === riesgo);
    }
  }

  public ejecutarAccionDepuracion(prod: ProductoBajaRotacion) {
    alert(`Acción iniciada para ${prod.nombre} (${prod.codigo}):\n"${prod.accionSugerida}" enviada a la sucursal ${prod.sucursal}.`);
  }

  // CÁLCULOS KPI REPORTES
  public obtenerTotalVentasPagado(): number {
    return this.reporteVentas.reduce((sum, item) => sum + (Number(item.total_pagado) || 0), 0);
  }

  public obtenerTotalDescuentos(): number {
    return this.reporteDescuentos.reduce((sum, item) => sum + (Number(item.descuento) || 0), 0);
  }

  // EXPORTAR A EXCEL (.xlsx)
  public exportarReporteExcel() {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen General
    const resumenData = [
      { Indicador: 'Ingresos Reales', Valor: `$${this.metricasFinancieras?.ingresoReal || 0}` },
      { Indicador: 'Ganancia Neta', Valor: `$${this.metricasFinancieras?.gananciaNeta || 0}` },
      { Indicador: 'Transacciones Totales', Valor: this.totalTransaccionesGral },
      { Indicador: 'Stock en Riesgo', Valor: `$${this.capitalEstancadoTotal}` },
      { Indicador: 'Periodo Filtro', Valor: `${this.filtros.rangoTiempo} (${this.filtros.fechaInicio || 'Inicio'} a ${this.filtros.fechaFin || 'Fin'})` }
    ];
    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

    // Hoja 2: Ventas Detalladas
    if (this.reporteVentas.length > 0) {
      const ventasFormat = this.reporteVentas.map(v => ({
        Folio: v.folio,
        Fecha: v.fecha_emision,
        Cliente: v.cliente,
        Estatus: v.estatus,
        'Total Orden ($)': v.total_orden,
        'Total Pagado ($)': v.total_pagado
      }));
      const wsVentas = XLSX.utils.json_to_sheet(ventasFormat);
      XLSX.utils.book_append_sheet(wb, wsVentas, 'Reporte Ventas');
    }

    // Hoja 3: Descuentos
    if (this.reporteDescuentos.length > 0) {
      const descuentosFormat = this.reporteDescuentos.map(d => ({
        Folio: d.folio_orden || d.num_factura || 'N/A',
        Fecha: d.fecha,
        Cliente: d.cliente,
        'Subtotal ($)': d.subtotal,
        'Descuento ($)': d.descuento,
        'Total ($)': d.total
      }));
      const wsDescuentos = XLSX.utils.json_to_sheet(descuentosFormat);
      XLSX.utils.book_append_sheet(wb, wsDescuentos, 'Descuentos Aplicados');
    }

    // Hoja 4: Top Productos
    if (this.topProductos.length > 0) {
      const topFormat = this.topProductos.map(p => ({
        Código: p.codigo,
        Nombre: p.nombre,
        Categoría: p.categoria,
        'Unidades Vendidas': p.unidadesVendidas,
        'Total Ventas ($)': p.totalVentas,
        Stock: p.stockActual
      }));
      const wsTop = XLSX.utils.json_to_sheet(topFormat);
      XLSX.utils.book_append_sheet(wb, wsTop, 'Top Productos');
    }

    const fileName = `Informe_Dashboard_OpticaHL_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // EXPORTAR A PDF (.pdf con Tablas y Gráficas)
  public exportarReportePDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const fechaActual = new Date().toLocaleDateString('es-MX');

    // Encabezado Principal
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('ÓPTICA HL - INFORME EJECUTIVO & BI', 14, 16);
    doc.setFontSize(10);
    doc.text(`Fecha de Emisión: ${fechaActual} | Periodo: ${this.filtros.rangoTiempo}`, 14, 23);

    let yOffset = 35;

    // Métricas Resumen
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(13);
    doc.text('1. RESUMEN DE INDICADORES CLAVE (KPIs)', 14, yOffset);
    yOffset += 6;

    autoTable(doc, {
      startY: yOffset,
      head: [['Métrica', 'Valor Actual', 'Detalle / Estado']],
      body: [
        ['Ingresos Reales', `$${(this.metricasFinancieras?.ingresoReal || 0).toLocaleString('es-MX')}`, `${this.metricasFinancieras?.cumplimientoMetaPorcentaje || 0}% Meta alcanzada`],
        ['Ganancia Neta', `$${(this.metricasFinancieras?.gananciaNeta || 0).toLocaleString('es-MX')}`, `Margen Neto: ${this.metricasFinancieras?.margenNetoPorcentaje || 0}%`],
        ['Transacciones Totales', `${this.totalTransaccionesGral}`, `Monto total: $${this.totalMontoGral.toLocaleString('es-MX')}`],
        ['Stock en Riesgo', `$${this.capitalEstancadoTotal.toLocaleString('es-MX')}`, `${this.itemsEstancadosTotal} artículos estancados`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [56, 128, 255] }
    });

    yOffset = (doc as any).lastAutoTable.finalY + 10;

    // Distribución por Sucursal
    doc.setFontSize(13);
    doc.text('2. DISTRIBUCIÓN COMERCIAL POR SUCURSAL', 14, yOffset);
    yOffset += 6;

    const sucursalesBody = this.distribucionSucursales.map(s => [
      s.nombre,
      s.numTransacciones.toString(),
      `$${s.montoTotal.toLocaleString('es-MX')}`,
      `${s.porcentaje}%`
    ]);

    autoTable(doc, {
      startY: yOffset,
      head: [['Sucursal', 'Transacciones', 'Monto Total', 'Participación']],
      body: sucursalesBody,
      theme: 'grid',
      headStyles: { fillColor: [45, 211, 111] }
    });

    yOffset = (doc as any).lastAutoTable.finalY + 10;

    // Tabla de Ventas Recientes
    if (this.reporteVentas.length > 0) {
      if (yOffset > 240) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(13);
      doc.text('3. REPORTES DETALLADOS DE VENTAS', 14, yOffset);
      yOffset += 6;

      const ventasBody = this.reporteVentas.slice(0, 10).map(v => [
        v.folio,
        v.cliente,
        v.estatus,
        `$${Number(v.total_orden).toLocaleString('es-MX')}`,
        `$${Number(v.total_pagado).toLocaleString('es-MX')}`
      ]);

      autoTable(doc, {
        startY: yOffset,
        head: [['Folio', 'Cliente', 'Estatus', 'Total Orden', 'Total Pagado']],
        body: ventasBody,
        theme: 'striped',
        headStyles: { fillColor: [112, 68, 255] }
      });
    }

    doc.save(`Informe_Ejecutivo_OpticaHL_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
