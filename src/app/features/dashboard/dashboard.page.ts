import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';

import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonSelect, IonSelectOption,
  IonSegment, IonSegmentButton, IonBadge, IonChip, IonLabel,
  IonSpinner, IonRefresher, IonRefresherContent, IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  pieChartOutline, barChartOutline, trendingUpOutline, alertCircleOutline,
  cashOutline, eyeOutline, peopleOutline, funnelOutline, calendarOutline,
  filterOutline, refreshOutline, downloadOutline, pricetagOutline,
  arrowUpOutline, arrowDownOutline, checkmarkCircleOutline, storefrontOutline,
  trophyOutline, sparklesOutline, cubeOutline, cartOutline, flashOutline,
  statsChartOutline, analyticsOutline, buildOutline
} from 'ionicons/icons';

import {
  DashboardService,
  SucursalVenta,
  ProductoRotacion,
  ProductoBajaRotacion,
  MetricasFinancieras,
  ProductividadOperador,
  FiltrosDashboard
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
    BaseChartDirective,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonSelect, IonSelectOption,
    IonSegment, IonSegmentButton, IonBadge, IonChip, IonLabel,
    IonSpinner, IonRefresher, IonRefresherContent, IonMenuButton
  ]
})
export class DashboardPage implements OnInit {

  // Estado de Filtros
  public filtros: FiltrosDashboard = {
    idSucursal: 0, // Todas
    rangoTiempo: 'MENSUAL'
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
    indexAxis: 'y', // Barras horizontales para ranking legible
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
    plugins: {
      legend: { display: true, position: 'top' }
    },
    scales: {
      y: { beginAtZero: true }
    }
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
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };
  public barOptoData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

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
      statsChartOutline, analyticsOutline, buildOutline
    });
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

  public doRefresh(event: any) {
    this.cargarDashboard(() => {
      event.target.complete();
    });
  }

  public cargarDashboard(callback?: () => void) {
    this.cargando = true;
    let pendientes = 5;

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

        // Chart Mostrador
        this.barMostradorData = {
          labels: prod.mostrador.map(m => m.nombre),
          datasets: [
            {
              label: 'Monto Ventas ($)',
              data: prod.mostrador.map(m => m.ventasCerradasMonto),
              backgroundColor: '#3880ff',
              borderRadius: 6
            }
          ]
        };

        // Chart Optometristas
        this.barOptoData = {
          labels: prod.optometristas.map(o => o.nombre),
          datasets: [
            {
              label: 'Exámenes / Refracciones',
              data: prod.optometristas.map(o => o.refraccionesCompletadas),
              backgroundColor: '#2dd36f',
              borderRadius: 6
            }
          ]
        };
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

  public exportarReportePDF() {
    alert('Exportando Informe de Dashboard a PDF/Excel con los filtros seleccionados...');
  }
}
