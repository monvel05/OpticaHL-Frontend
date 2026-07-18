import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
  IonList, IonItem, IonSelect, IonSelectOption, IonFooter, IonIcon,
  ModalController, LoadingController, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline } from 'ionicons/icons';
import { FacturacionService } from '../../../core/services/facturacion.service'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-modal-facturacion',
  templateUrl: './modal-facturacion.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonContent, 
    IonList, 
    IonItem, 
    IonSelect, 
    IonSelectOption, 
    IonFooter, 
    IonIcon
  ]
})
export class ModalFacturacionComponent {
  @Input() orden!: any; // Recibimos la orden completa desde el Historial

  private modalCtrl = inject(ModalController);
  private facturacionService = inject(FacturacionService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  // Valores por defecto (muy comunes para clientes de óptica)
  datosFiscales = {
    uso_cfdi: 'G03',
    regimen_fiscal: '616', // Sin obligaciones fiscales
    metodo_pago: 'PUE',
    forma_pago: '01' // Efectivo
  };

  constructor() {
    addIcons({ documentTextOutline });
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async timbrar() {
    // Mostramos un loader mientras el backend habla con el SAT
    const loading = await this.loadingCtrl.create({
      message: 'Conectando con el SAT...',
      spinner: 'crescent'
    });
    await loading.present();

    const payload = {
      folio_orden: this.orden.folio,
      id_sucursal: 1, // TODO: Reemplazar con el ID de sucursal del Auth Service
      id_operador: 1, // TODO: Reemplazar con el ID del operador logueado
      ...this.datosFiscales
    };

    this.facturacionService.timbrarFactura(payload).subscribe({
      next: async (res) => {
        await loading.dismiss();
        
        const toast = await this.toastCtrl.create({
          message: `¡Factura generada exitosamente! UUID: ${res.datos.uuid}`,
          duration: 4000,
          color: 'success',
          position: 'top'
        });
        await toast.present();

        // Cerramos el modal y le avisamos al padre que fue un éxito
        this.modalCtrl.dismiss({ facturado: true });
      },
      error: async (err) => {
        await loading.dismiss();
        
        // Extraemos el error del PAC que nos manda tu backend
        const msjError = err.error?.detalle || err.error?.mensaje || 'Ocurrió un error inesperado';
        
        const toast = await this.toastCtrl.create({
          message: `Error del SAT: ${msjError}`,
          duration: 6000,
          color: 'danger',
          buttons: ['Cerrar']
        });
        await toast.present();
      }
    });
  }
}