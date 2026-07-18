import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonButton, IonIcon, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { printOutline, barcodeOutline } from 'ionicons/icons';
import { ImpresoraZebraService } from '../../../core/services/impresora-zebra.service';

@Component({
  selector: 'app-impresion-etiquetas',
  standalone: true,
  imports: [
    CommonModule, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent, 
    IonButton, 
    IonIcon
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './impresion-etiquetas.component.html',
})
export class ImpresionEtiquetasComponent {
  // Recibe el producto seleccionado desde tu tabla de inventario
  @Input() productoSeleccionado: any = null;
  imprimiendo = false;

  constructor(
    private zebraService: ImpresoraZebraService,
    private toastController: ToastController
  ) {
    addIcons({ printOutline, barcodeOutline });
  }

  async imprimir() {
    if (!this.productoSeleccionado) return;

    this.imprimiendo = true;

    this.zebraService.imprimirEtiqueta(this.productoSeleccionado).subscribe({
      next: async () => {
        this.imprimiendo = false;
        const toast = await this.toastController.create({
          message: 'Etiqueta enviada a la impresora Zebra.',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        toast.present();
      },
      error: async (err) => {
        this.imprimiendo = false;
        const toast = await this.toastController.create({
          message: err.message,
          duration: 4000,
          color: 'danger',
          position: 'bottom',
          buttons: ['OK']
        });
        toast.present();
      }
    });
  }
}