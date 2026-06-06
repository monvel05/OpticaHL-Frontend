import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, folderOpenOutline, documentTextOutline } from 'ionicons/icons';

@Component({
  selector: 'app-historial-orden',
  templateUrl: './historial-orden.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class HistorialOrdenComponent implements OnInit {
  // Recibe los datos crudos desde el mostrador
  @Input() historialRaw: any[] = [];
  @Input() nombreCliente: string = '';

  private modalCtrl = inject(ModalController);
  historialAgrupado: any[] = [];

  constructor() {
    addIcons({ closeOutline, folderOpenOutline, documentTextOutline });
  }

  ngOnInit() {
    this.estructurarHistorial();
  }

  /**
   * Procesa las filas sueltas de la base de datos (OD e OI por separado)
   * y las unifica por Folio para armar la tabla comparativa.
   */
  estructurarHistorial() {
    const grupos: { [key: string]: any } = {};

    this.historialRaw.forEach(fila => {
      if (!grupos[fila.folio]) {
        grupos[fila.folio] = {
          folio: fila.folio,
          fecha_emision: fila.fecha_emision,
          observaciones: fila.observaciones,
          od: null,
          oi: null
        };
      }

      // Detectamos qué ojo es y le asignamos sus micas correspondientes
      const ojoKey = fila.ojo ? fila.ojo.toUpperCase() : '';
      if (ojoKey.includes('DERECHO') || ojoKey === 'OD') {
        grupos[fila.folio].od = fila;
      } else if (ojoKey.includes('IZQUIERDO') || ojoKey === 'OI') {
        grupos[fila.folio].oi = fila;
      } else {
        // Por si guardaron ambos ojos formateados en una sola fila string
        grupos[fila.folio].od = fila;
        grupos[fila.folio].oi = fila;
      }
    });

    // Convertimos el objeto mapeado en un arreglo ordenado por fecha
    this.historialAgrupado = Object.values(grupos);
    console.log('📜 Historial estructurado para la vista:', this.historialAgrupado);
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}