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
  // Recibe los datos limpios directamente desde el backend a través del panel principal
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
   * 🎯 ACTUALIZADO: Transforma la estructura plana de la nueva consulta de MySQL
   * al formato de objetos que utiliza tu tabla del HTML.
   */
  estructurarHistorial() {
    console.log('📜 Datos crudos recibidos del backend:', this.historialRaw);

    // Mapeamos directamente cada consulta de la base de datos
    this.historialAgrupado = this.historialRaw.map(consulta => {
      return {
        folio: consulta.folio,
        fecha_emision: consulta.fecha_emision,
        observaciones: consulta.observaciones,
        // Construimos el objeto del Ojo Derecho usando tus nuevas columnas
        od: {
          esfera: consulta.od_esfera,
          cilindro: consulta.od_cilindro,
          eje: consulta.od_eje,
          adicion: consulta.od_adicion
        },
        // Construimos el objeto del Ojo Izquierdo usando tus nuevas columnas
        oi: {
          esfera: consulta.oi_esfera,
          cilindro: consulta.oi_cilindro,
          eje: consulta.oi_eje,
          adicion: consulta.oi_adicion
        }
      };
    });

    console.log('📜 Historial mapeado listo para la tabla:', this.historialAgrupado);
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }
}