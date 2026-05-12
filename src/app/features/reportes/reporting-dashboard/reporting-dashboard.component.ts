import { Component, OnInit } from '@angular/core';
import { FilterPanelComponent } from '../../../shared/components/filter-panel/filter-panel.component';
import { ReportFilterService } from '../../../core/services/report-filter.service';
import { CommonModule } from '@angular/common';
// Importa aquí tu componente de gráfica cuando lo tengas

@Component({
  selector: 'app-reporting-dashboard',
  standalone: true,
  imports: [FilterPanelComponent, CommonModule], 
  template: `
    <div class="container">
      <h1>Reporte de Ventas</h1>
      
      <app-filter-panel></app-filter-panel>

      <div class="charts-grid">
        <p>Esperando datos de: {{ (filtros$ | async)?.fechaInicio }}</p>
      </div>
    </div>
  `
})
export class ReportingDashboardComponent implements OnInit {
  filtros$;

  constructor(private filterService: ReportFilterService) {
    this.filtros$ = this.filterService.filtros$;
  }

  ngOnInit() {
    // Aquí podrías suscribirte para llamar a tu API de ventas
    this.filtros$.subscribe(f => {
      console.log('Llamando a la API con:', f);
    });
  }
}