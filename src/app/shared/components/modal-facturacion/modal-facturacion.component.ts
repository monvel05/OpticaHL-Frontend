import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonButtons, IonItem, IonLabel, IonSelect, IonSelectOption, 
  ModalController, ToastController, LoadingController 
} from '@ionic/angular/standalone';
import { FacturacionService } from '../../../core/services/facturacion.service';

@Component({
  selector: 'app-modal-facturacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonButton, IonButtons, IonItem, IonLabel, 
    IonSelect, IonSelectOption
  ],
  templateUrl: './modal-facturacion.component.html',
  styleUrls: ['./modal-facturacion.component.scss']
})
export class ModalFacturacionComponent {
  // Inyecciones modernas
  private modalCtrl = inject(ModalController);
  private facturacionService = inject(FacturacionService);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  // Inputs recibidos al abrir el modal (ej. folio de la orden a facturar)
  folioOrden = input.required<string>();

  // Signals para el manejo del formulario
  usoCfdi = signal<string>('G01');
  regimenFiscal = signal<string>('616');
  metodoPago = signal<string>('PUE');
  formaPago = signal<string>('01');

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async timbrar() {
    const loading = await this.loadingCtrl.create({
      message: 'Timbrando factura ante el SAT...',
      spinner: 'circular'
    });
    await loading.present();

    const payload = {
      folio_orden: this.folioOrden(),
      uso_cfdi: this.usoCfdi(),
      regimen_fiscal: this.regimenFiscal(),
      metodo_pago: this.metodoPago(),
      forma_pago: this.formaPago(),
      id_sucursal: 1, // Obtener dinámicamente del contexto del usuario
      id_operador: 1  // Obtener dinámicamente del token
    };

    this.facturacionService.generarFactura(payload).subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.mostrarToast('Factura timbrada exitosamente', 'success');
        // Devolvemos los datos al componente padre (ej. base64 del PDF)
        this.modalCtrl.dismiss(res.datos);
      },
      error: async (err) => {
        await loading.dismiss();
        this.mostrarToast(`Error: ${err.error.mensaje}`, 'danger');
      }
    });
  }

  private async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3500,
      color: color
    });
    await toast.present();
  }
}