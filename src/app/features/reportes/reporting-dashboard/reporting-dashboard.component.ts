import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Importaciones de Ionic Standalone
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow,
  IonCol, IonItem, IonLabel, IonDatetime, IonSpinner, IonBadge, IonButtons
} from '@ionic/angular/standalone';

// Registro de Iconos de Ionic
import { addIcons } from 'ionicons';
import {
  downloadOutline, funnelOutline, searchOutline,
  cartOutline, pricetagOutline, pricetagsOutline, documentTextOutline
} from 'ionicons/icons';

// ==========================================
// INTERFACES (Definición de Tipos)
// ==========================================
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

@Component({
  selector: 'app-reporting-dashboard',
  templateUrl: './reporting-dashboard.component.html',
  styleUrls: ['./reporting-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow,
    IonCol, IonItem, IonLabel, IonDatetime, IonSpinner, IonBadge, IonButtons
  ]
})
export class ReportingDashboardComponent implements OnInit {

  // Inyección de dependencias
  private fb = inject(FormBuilder);

  // Variables de estado
  public filtroForm!: FormGroup;
  public cargando = false;

  // Listas para almacenar los resultados del reporte
  public reporteVentas: VentaReporte[] = [];
  public reporteDescuentos: DescuentoReporte[] = [];

  constructor() {
    // Registro global de íconos
    addIcons({
      'download-outline': downloadOutline,
      'funnel-outline': funnelOutline,
      'search-outline': searchOutline,
      'cart-outline': cartOutline,
      'pricetag-outline': pricetagOutline,
      'pricetags-outline': pricetagsOutline,
      'document-text-outline': documentTextOutline
    });
  }

  ngOnInit() {
    this.inicializarFormulario();
    this.consultarReporte(); 
  }

  private inicializarFormulario() {
    const hoy = new Date();
    const haceUnMes = new Date();
    haceUnMes.setMonth(hoy.getMonth() - 1);

    this.filtroForm = this.fb.group({
      fechaInicio: [haceUnMes.toISOString(), [Validators.required]],
      fechaFin: [hoy.toISOString(), [Validators.required]]
    });
  }

  /**
   * Carga los reportes (o usa datos de prueba temporalmente)
   */
  public consultarReporte() {
    if (this.filtroForm.invalid) return;

    this.cargando = true;

    // Simulación de carga (sustituir por tu llamado a API cuando tengas el servicio)
    setTimeout(() => {
      this.reporteVentas = [
        { folio: 'ORD-001', fecha_emision: new Date(), cliente: 'Juan Pérez', estatus: 'PAGADO', total_orden: 1500, total_pagado: 1500 },
        { folio: 'ORD-002', fecha_emision: new Date(), cliente: 'María López', estatus: 'COMPLETADO', total_orden: 2800, total_pagado: 2800 }
      ];

      this.reporteDescuentos = [
        { folio_orden: 'ORD-001', fecha: new Date(), cliente: 'Juan Pérez', subtotal: 1700, descuento: 200, total: 1500 }
      ];

      this.cargando = false;
    }, 800);
  }

  public exportarAExcel() {
    if (this.reporteVentas.length === 0 && this.reporteDescuentos.length === 0) return;
    console.log('Exportando datos a Excel...');
  }

  // ==========================================
  // CÁLCULOS KPI
  // ==========================================
  public obtenerTotalPagado(): number {
    return this.reporteVentas.reduce((sum, item) => sum + (Number(item.total_pagado) || 0), 0);
  }

  public obtenerTotalDescuentos(): number {
    return this.reporteDescuentos.reduce((sum, item) => sum + (Number(item.descuento) || 0), 0);
  }

}