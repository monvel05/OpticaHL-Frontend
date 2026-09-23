import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, 
  IonContent, IonCard, IonLabel, IonCardContent, ModalController,
  IonSegment, IonSegmentButton, IonGrid, IonRow, IonCol, IonChip 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, folderOpenOutline, documentTextOutline, 
  medicalOutline, glassesOutline, cartOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-historial-orden',
  templateUrl: './historial-orden.component.html',
  styleUrls: ['./historial-orden.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonLabel, 
    IonCardContent,
    IonSegment,
    IonSegmentButton,
    IonGrid,
    IonRow,
    IonCol,
    IonChip
  ]
})
export class HistorialOrdenComponent implements OnInit {
  // 🎯 Recibimos por separado las listas enviadas desde el mostrador
  @Input() historialClinico: any[] = [];
  @Input() historialMateriales: any[] = [];
  @Input() historialRaw: any = null; // Soporte para llamadas antiguas
  @Input() nombreCliente: string = '';

  private modalCtrl = inject(ModalController);

  public pestanaActiva: string = 'clinico';

  constructor() {
    addIcons({
      closeOutline,
      medicalOutline,
      glassesOutline,
      documentTextOutline,
      cartOutline,
      folderOpenOutline
    });
  }

  ngOnInit() {
    this.estructurarHistorial();
  }

  estructurarHistorial() {
    console.log('📜 Clínico recibido:', this.historialClinico);
    console.log('📦 Materiales recibidos:', this.historialMateriales);

    // 🛡️ Si el componente recibió la estructura `historialRaw` en lugar de las listas separadas:
    if (this.historialRaw) {
      if (this.historialRaw.clinico || this.historialRaw.materiales) {
        this.historialClinico = this.historialRaw.clinico || [];
        this.historialMateriales = this.historialRaw.materiales || [];
      } else if (Array.isArray(this.historialRaw)) {
        this.historialClinico = this.historialRaw;
      } else if (this.historialRaw.data) {
        this.historialClinico = this.historialRaw.data.clinico || [];
        this.historialMateriales = this.historialRaw.data.materiales || [];
      }
    }

    // 🎯 Normalización de datos clínicos para el formato de tabla en HTML
    if (Array.isArray(this.historialClinico) && this.historialClinico.length > 0) {
      this.historialClinico = this.historialClinico.map(consulta => ({
        folio: consulta.folio || consulta.folio_orden || 'S/F',
        fecha_emision: consulta.fecha_emision || consulta.fecha || consulta.created_at,
        observaciones: consulta.observaciones || consulta.notas || null,
        od_esfera: consulta.od_esfera ?? consulta.od?.esfera ?? '-',
        od_cilindro: consulta.od_cilindro ?? consulta.od?.cilindro ?? '-',
        od_eje: consulta.od_eje ?? consulta.od?.eje ?? '-',
        od_adicion: consulta.od_adicion ?? consulta.od?.adicion ?? '-',
        oi_esfera: consulta.oi_esfera ?? consulta.oi?.esfera ?? '-',
        oi_cilindro: consulta.oi_cilindro ?? consulta.oi?.cilindro ?? '-',
        oi_eje: consulta.oi_eje ?? consulta.oi?.eje ?? '-',
        oi_adicion: consulta.oi_adicion ?? consulta.oi?.adicion ?? '-'
      }));
    }

    console.log('✅ Historial Clínico procesado:', this.historialClinico);
    console.log('✅ Historial Materiales procesado:', this.historialMateriales);
  }

  cerrarModal() {
    this.modalCtrl.dismiss();
  }
}