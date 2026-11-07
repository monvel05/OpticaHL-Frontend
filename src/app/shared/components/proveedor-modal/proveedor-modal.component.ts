import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonItem, IonLabel, IonInput, IonTextarea, IonRadioGroup, 
  IonRadio, IonGrid, IonRow, IonCol, ModalController, ToastController 
} from '@ionic/angular/standalone';
import { ProveedoresService, Proveedor } from '../../../core/services/proveedores.service';

@Component({
  selector: 'app-proveedor-modal',
  templateUrl: './proveedor-modal.component.html',
  styleUrls: ['./proveedor-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
    IonItem, IonLabel, IonInput, IonTextarea, IonRadioGroup, 
    IonRadio, IonGrid, IonRow, IonCol
  ]
})
export class ProveedorModalComponent implements OnInit {
  @Input() proveedorEditar: Proveedor | null = null;

  proveedor: Proveedor = {
    tipo_cliente: 'Negocio',
    razon_social: '',
    domicilio: '',
    colonia: '',
    localidad: 'AGUASCALIENTES',
    estado: 'AGUASCALIENTES',
    cp: '',
    lada: '449',
    tel_negocio: '',
    ext: '',
    fax: '',
    email: '',
    responsable: '',
    telefono_responsable: '',
    celular: '',
    observaciones: ''
  };

  constructor(
    private modalCtrl: ModalController,
    private provService: ProveedoresService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    if (this.proveedorEditar) {
      this.proveedor = { ...this.proveedorEditar };
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  guardar() {
    if (!this.proveedor.razon_social?.trim()) {
      this.mostrarToast('La Razón Social es requerida', 'warning');
      return;
    }

    this.provService.guardarProveedor(this.proveedor).subscribe({
      next: () => {
        this.mostrarToast('Proveedor guardado con éxito', 'success');
        this.modalCtrl.dismiss(true);
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.mostrarToast('Error al guardar proveedor', 'danger');
      }
    });
  }

  async mostrarToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color });
    toast.present();
  }
}