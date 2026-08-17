import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonRow, IonCol, IonList, IonItem, IonLabel, IonBackButton 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline, documentTextOutline, closeOutline } from 'ionicons/icons';
import { CajaService } from '../../core/services/caja.service';

@Component({
  selector: 'app-cortecaja',
  templateUrl: './cortecaja.page.html',
  styleUrls: ['./cortecaja.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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

  datosCorte: any = null;

  constructor() {
    addIcons({
      refreshOutline,
      documentTextOutline,
      closeOutline
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
      },
      error: (err: any) => {
        console.error('Error al obtener el corte de caja:', err);
        alert('No se pudo cargar la información del corte de caja.');
      }
    });
  }

  imprimirCortePDF() {
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
      ventanaPDF.document.write('Generando Ticket de Corte de Caja...');
    }

    // Llama al servicio de corte en PDF si cuentas con el endpoint en el backend
    this.cajaService.descargarTicketCortePDF().subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        if (ventanaPDF) {
          ventanaPDF.location.href = blobUrl;
        } else {
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `Corte_Caja_${new Date().toISOString().slice(0,10)}.pdf`;
          link.click();
        }
      },
      error: (err: any) => {
        if (ventanaPDF) ventanaPDF.close();
        console.error('Error generando PDF de corte:', err);
        alert('Error al descargar el PDF del corte de caja.');
      }
    });
  }
}