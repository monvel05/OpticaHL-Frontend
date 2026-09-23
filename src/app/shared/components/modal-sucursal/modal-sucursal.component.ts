import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonButtons, IonItem, IonLabel, IonInput, IonToggle, IonTextarea,
  IonIcon, ModalController, ToastController, IonList, IonItemDivider
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, checkmarkOutline, businessOutline, closeOutline } from 'ionicons/icons';
import { SucursalesService, Sucursal } from '../../../core/services/sucursales.service';

@Component({
  selector: 'app-modal-sucursal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonButton, IonButtons, IonItem, IonLabel, 
    IonInput, IonToggle, IonTextarea, IonIcon, IonList, IonItemDivider
  ],
  templateUrl: './modal-sucursal.component.html',
  styles: [`
    .modal-content-container {
      padding: 16px;
    }
    .field-hint {
      font-size: 0.78rem;
      color: var(--ion-color-medium);
      margin-top: 4px;
    }
  `]
})
export class ModalSucursalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private sucursalesService = inject(SucursalesService);
  private toastCtrl = inject(ToastController);

  @Input() sucursalActual?: Sucursal;

  public formData: Partial<Sucursal> = {
    id_sucursal: '',
    nombre: '',
    direccion: '',
    activo: true
  };

  public esEdicion = false;
  public cargandoGuardado = false;

  constructor() {
    addIcons({ checkmarkCircle, checkmarkOutline, businessOutline, closeOutline });
  }

  ngOnInit() {
    if (this.sucursalActual) {
      this.esEdicion = true;
      this.formData = { 
        ...this.sucursalActual 
      };
    }
  }

  cerrarModal() {
    this.modalCtrl.dismiss(false);
  }

  guardar() {
    if (!this.formData.id_sucursal || !this.formData.id_sucursal.trim()) {
      this.mostrarToast('El código de la sucursal (ej. HL03) es obligatorio.', 'danger');
      return;
    }

    if (!this.formData.nombre || !this.formData.nombre.trim()) {
      this.mostrarToast('El nombre de la sucursal es obligatorio.', 'danger');
      return;
    }

    this.cargandoGuardado = true;
    const dataProcesada: Sucursal = {
      id_sucursal: this.formData.id_sucursal.trim().toUpperCase(),
      nombre: this.formData.nombre.trim(),
      direccion: this.formData.direccion ? this.formData.direccion.trim() : '',
      activo: Boolean(this.formData.activo)
    };

    if (this.esEdicion) {
      this.sucursalesService.actualizarSucursal(dataProcesada.id_sucursal, dataProcesada).subscribe({
        next: (res) => {
          this.cargandoGuardado = false;
          if (res.exito !== false) {
            this.finalizarGuardado('Sucursal actualizada con éxito.');
          } else {
            this.mostrarToast(res.mensaje || 'Error al actualizar la sucursal.', 'danger');
          }
        },
        error: (err) => {
          this.cargandoGuardado = false;
          this.mostrarToast(err.error?.mensaje || 'Error al actualizar sucursal.', 'danger');
        }
      });
    } else {
      this.sucursalesService.crearSucursal(dataProcesada).subscribe({
        next: (res) => {
          this.cargandoGuardado = false;
          if (res.exito !== false) {
            this.finalizarGuardado('Sucursal registrada con éxito.');
          } else {
            this.mostrarToast(res.mensaje || 'Error al registrar la sucursal.', 'danger');
          }
        },
        error: (err) => {
          this.cargandoGuardado = false;
          this.mostrarToast(err.error?.mensaje || 'Error al registrar sucursal.', 'danger');
        }
      });
    }
  }

  private async finalizarGuardado(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
    this.modalCtrl.dismiss(true);
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning' = 'info' as any) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
