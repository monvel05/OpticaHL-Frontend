import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts'; // Solo necesitamos la directiva aquí
import { ChartConfiguration, ChartType, Chart, registerables, ChartData } from 'chart.js';
import { ReportFilterService } from '../../../core/services/report-filter.service';

Chart.register(...registerables);

@Component({
  selector: 'app-ventas-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective], // Importante: BaseChartDirective debe estar aquí
  templateUrl: './ventas-chart.component.html', // Usaremos el archivo HTML externo
  styleUrls: ['./ventas-chart.component.css'] // O el array de styles que tenías
})
export class VentasChartComponent implements OnInit {

  public lineChartType: ChartType = 'line';
  
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    }
  };

  // Tipado explícito para evitar errores de ngtsc
  public lineChartData: ChartData<'line'> = {
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55, 40],
        label: 'Ventas de Sucursal',
        fill: true,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ],
    labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
  };

  constructor(private filterService: ReportFilterService) {}

  ngOnInit() {
    this.filterService.filtros$.subscribe(filtros => {
      if (filtros) {
        this.actualizarDatosSimulados();
      }
    });
  }

  private actualizarDatosSimulados() {
    const nuevosDatos = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100));
    
    // Clonación necesaria para disparar la detección de cambios
    this.lineChartData = {
      ...this.lineChartData,
      datasets: [
        {
          ...this.lineChartData.datasets[0],
          data: nuevosDatos
        }
      ]
    };
  }
}