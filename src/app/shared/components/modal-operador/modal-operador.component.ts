import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonButtons, IonItem, IonLabel, IonInput, IonSelect, 
  IonSelectOption, IonToggle, ModalController, ToastController, IonList
} from '@ionic/angular/standalone';
import { OperadoresService, Operador } from '../../../core/services/operadores.service';

@Component({
  selector: 'app-modal-operador',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonButton, IonButtons, IonItem, IonLabel, 
    IonInput, IonSelect, IonSelectOption, IonToggle, IonList
  ],
  templateUrl: './modal-operador.component.html'
})
export class ModalOperadorComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private operadoresService = inject(OperadoresService);
  private toastCtrl = inject(ToastController);

  // Recibe datos si es edición, si es undefined significa que estamos creando uno nuevo
  @Input() operadorActual?: Operador;

  // Modelo de datos atado al formulario
  formData: Partial<Operador> = {
    nombre_completo: '',
    usuario_login: '',
    password: '',
    id_sucursal: 1, // Por defecto matriz
    activo: true,
    roles: ['MOSTRADOR']
  };

  esEdicion = false;

  ngOnInit() {
    if (this.operadorActual) {
      this.esEdicion = true;
      // Clonamos el objeto para no modificar la lista por debajo hasta guardar
      this.formData = { ...this.operadorActual, password: '' }; 
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  guardar() {
    if (this.esEdicion) {
      this.operadoresService.actualizarOperador(this.formData.id_operador!, this.formData).subscribe({
        next: () => this.finalizarGuardado('Operador actualizado con éxito'),
        error: (err) => this.mostrarError(err.error.mensaje)
      });
    } else {
      this.operadoresService.crearOperador(this.formData as Operador).subscribe({
        next: () => this.finalizarGuardado('Operador creado con éxito'),
        error: (err) => this.mostrarError(err.error.mensaje)
      });
    }
  }

  private async finalizarGuardado(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color: 'success' });
    await toast.present();
    this.modalCtrl.dismiss(true); // El 'true' avisa a la página principal que debe recargar la lista
  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje || 'Error interno', duration: 3000, color: 'danger' });
    await toast.present();
  }
}