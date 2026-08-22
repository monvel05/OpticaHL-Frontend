import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonRow, IonCol, IonList, IonItem, IonLabel, IonBackButton,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  refreshOutline, documentTextOutline, closeOutline, 
  removeCircleOutline, checkmarkCircleOutline, arrowBackOutline 
} from 'ionicons/icons';
import { CajaService } from '../../core/services/caja.service';

@Component({
  selector: 'app-cortecaja',
  templateUrl: './cortecaja.page.html',
  styleUrls: ['./cortecaja.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonBackButton
  ]
})
export class CortecajaPage implements OnInit {
  private cajaService = inject(CajaService);
  private alertCtrl = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);

  datosCorte: any = null;

  constructor() {
    addIcons({
      refreshOutline,
      documentTextOutline,
      closeOutline,
      removeCircleOutline,
      checkmarkCircleOutline,
      arrowBackOutline
    });
  }

  ngOnInit() {
    this.cargarCorteCaja();
  }

  ionViewWillEnter() {
    this.cargarCorteCaja();
  }

  cargarCorteCaja() {
    this.cajaService.getCorteCaja().subscribe({
      next: (res: any) => {
        this.datosCorte = res;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al obtener el corte de caja:', err);
      }
    });
  }

  async registrarGasto() {
    const alertGasto = await this.alertCtrl.create({
      header: 'Registrar Gasto / Salida',
      inputs: [
        {
          name: 'concepto',
          type: 'text',
          placeholder: 'Concepto (Ej. Comida, Limpieza)'
        },
        {
          name: 'monto',
          type: 'number',
          placeholder: 'Monto ($)',
          attributes: { min: 1 }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Registrar',
          handler: (data) => {
            if (!data.concepto || !data.monto || Number(data.monto) <= 0) {
              alert('Por favor ingrese un concepto y un monto válido.');
              return false;
            }

            const gastoPayload = {
              folio_orden: null,
              id_gasto: 1,
              id_sucursal: 'HL01',
              tipo_movimiento: 'EGRESO',
              metodo_pago: 'EFECTIVO',
              monto: Number(data.monto),
              concepto: `GASTO: ${data.concepto.toUpperCase()}`
            };

            this.cajaService.registrarMovimiento(gastoPayload).subscribe({
              next: () => {
                this.cargarCorteCaja();
              },
              error: (err: any) => {
                console.error('Error al registrar gasto:', err);
                alert(`Error: ${err.error?.mensaje || 'No se pudo registrar la salida.'}`);
              }
            });
            return true;
          }
        }
      ]
    });

    await alertGasto.present();
  }

  async confirmarYProcesarCorte() {
    const alertConfirmacion = await this.alertCtrl.create({
      header: '¿Confirmar Corte de Caja?',
      message: '¿Está seguro de cerrar el turno y realizar el corte? Una vez generado el ticket se limpiará la caja.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, Realizar Corte',
          handler: () => {
            this.ejecutarImpresionCorte();
          }
        }
      ]
    });

    await alertConfirmacion.present();
  }

  private ejecutarImpresionCorte() {
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
      ventanaPDF.document.write('Generando Ticket de Corte de Caja...');
    }

    this.cajaService.descargarTicketCortePDF().subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        if (ventanaPDF) {
          ventanaPDF.location.href = blobUrl;
        } else {
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `Corte_Caja_${new Date().toISOString().slice(0, 10)}.pdf`;
          link.click();
        }

        this.limpiarPantallaCorte();
      },
      error: (err: any) => {
        if (ventanaPDF) ventanaPDF.close();
        console.error('Error generando PDF de corte:', err);
        alert('Error al descargar el PDF del corte de caja.');
      }
    });
  }

  private limpiarPantallaCorte() {
    this.datosCorte = {
      resumen: {
        desglose: { efectivo: 0, tarjeta: 0, transferencia: 0 },
        totalIngresos: 0,
        totalEgresos: 0,
        saldoNeto: 0
      },
      movimientos: []
    };
    this.cdr.detectChanges();
  }
}