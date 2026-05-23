import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterPanelComponent } from '../../../shared/components/filter-panel/filter-panel.component';
import { ReportFilterService } from '../../../core/services/report-filter.service';
import { ReportesService } from '../../../core/services/reporte.service';
import { IonicModule } from '@ionic/angular';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reporting-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule, FilterPanelComponent], 
  templateUrl: './reporting-dashboard.component.html',
  styleUrls: ['./reporting-dashboard.component.scss'] // Opcional, si tienes estilos
})
export class ReportingDashboardComponent implements OnInit {
  filtros$;
  reporteVentas: any[] = [];
  reporteDescuentos: any[] = [];
  cargando = false;

  constructor(
    private filterService: ReportFilterService,
    private reportesService: ReportesService
  ) {
    this.filtros$ = this.filterService.filtros$;
  }

  ngOnInit() {
    this.filtros$.subscribe(f => {
      if (f && f.fechaInicio && f.fechaFin) {
        this.cargarDatos(f);
      }
    });
  }

  cargarDatos(filtros: any) {
    this.cargando = true;
    
    // 1. Cargar Ventas
    this.reportesService.obtenerReporteVentasCompleto(filtros.fechaInicio, filtros.fechaFin)
      .subscribe({
        next: (res) => this.reporteVentas = res.datos || [],
        error: (err) => console.error('Error al cargar ventas', err)
      });

    // 2. Cargar Descuentos (usando el mes de la fechaInicio como ejemplo)
    const fecha = new Date(filtros.fechaInicio);
    this.reportesService.obtenerReporteDescuentos(fecha.getMonth() + 1, fecha.getFullYear())
      .subscribe({
        next: (res) => {
          this.reporteDescuentos = res.datos || [];
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al cargar descuentos', err);
          this.cargando = false;
        }
      });
  }

  exportarAExcel() {
    // Creamos un libro de trabajo
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    // Hoja 1: Ventas
    const wsVentas: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.reporteVentas);
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas Completas');

    // Hoja 2: Descuentos
    const wsDescuentos: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.reporteDescuentos);
    XLSX.utils.book_append_sheet(wb, wsDescuentos, 'Descuentos del Mes');

    // Descargar el archivo
    XLSX.writeFile(wb, `Reporte_Contable_${new Date().getTime()}.xlsx`);
  }
}