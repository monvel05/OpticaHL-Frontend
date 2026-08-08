import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonButtons, IonItem, IonLabel, IonInput, IonSelect, 
  IonSelectOption, IonToggle, IonTextarea, IonChip, IonIcon,
  ModalController, ToastController, IonList
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, checkmarkOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { OperadoresService, Operador, CatalogosOperador } from '../../../core/services/operadores.service';

@Component({
  selector: 'app-modal-operador',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonButton, IonButtons, IonItem, IonLabel, 
    IonInput, IonSelect, IonSelectOption, IonToggle, IonTextarea,
    IonChip, IonIcon, IonList
  ],
  templateUrl: './modal-operador.component.html',
  styles: [`
    .roles-selection-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 0;
    }
    .role-chip-select {
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
    }
  `]
})
export class ModalOperadorComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private operadoresService = inject(OperadoresService);
  private toastCtrl = inject(ToastController);

  @Input() operadorActual?: Operador;
  @Input() catalogos?: CatalogosOperador;

  public rolesDisponibles = [
    'ADMINISTRADOR',
    'MOSTRADOR',
    'CAJER@',
    'INVENTARIO',
    'OPTOMETRISTA',
    'FACTURADOR@'
  ];

  public sucursalesDisponibles = [
    { id_sucursal: 1, nombre: 'Sucursal Matriz Centro' },
    { id_sucursal: 2, nombre: 'Sucursal Plaza Norte' },
    { id_sucursal: 3, nombre: 'Sucursal Galerías Sur' },
    { id_sucursal: 4, nombre: 'Sucursal Este Mirador' }
  ];

  formData: Partial<Operador> = {
    nombre_completo: '',
    usuario_login: '',
    password: '',
    id_sucursal: 1,
    activo: true,
    descripcion: '',
    roles: ['MOSTRADOR']
  };

  esEdicion = false;

  constructor() {
    addIcons({ checkmarkCircle, checkmarkOutline, shieldCheckmarkOutline });
  }

  ngOnInit() {
    if (this.catalogos && this.catalogos.sucursales && this.catalogos.sucursales.length > 0) {
      this.sucursalesDisponibles = this.catalogos.sucursales;
    }
    if (this.catalogos && this.catalogos.roles && this.catalogos.roles.length > 0) {
      this.rolesDisponibles = this.catalogos.roles.map(r => r.nombre_rol);
    }

    if (this.operadorActual) {
      this.esEdicion = true;
      this.formData = { 
        ...this.operadorActual, 
        password: '',
        roles: Array.isArray(this.operadorActual.roles) ? [...this.operadorActual.roles] : ['MOSTRADOR']
      }; 
    }
  }

  toggleRol(rol: string) {
    if (!this.formData.roles) this.formData.roles = [];
    const idx = this.formData.roles.indexOf(rol);
    if (idx >= 0) {
      this.formData.roles.splice(idx, 1);
    } else {
      this.formData.roles.push(rol);
    }
  }

  isRolSelected(rol: string): boolean {
    return !!(this.formData.roles && this.formData.roles.includes(rol));
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  guardar() {
    if (!this.formData.nombre_completo || !this.formData.nombre_completo.trim()) {
      this.mostrarError('El nombre completo es obligatorio');
      return;
    }
    if (!this.formData.usuario_login || !this.formData.usuario_login.trim()) {
      this.mostrarError('El nombre de usuario de login es obligatorio');
      return;
    }
    if (!this.esEdicion && (!this.formData.password || this.formData.password.trim().length < 6)) {
      this.mostrarError('La contraseña inicial debe tener al menos 6 caracteres');
      return;
    }

    if (this.esEdicion) {
      this.operadoresService.actualizarOperador(this.formData.id_operador!, this.formData).subscribe({
        next: (res) => {
          if (res.exito !== false) this.finalizarGuardado('Operador actualizado con éxito');
          else this.mostrarError(res.mensaje || 'Error al actualizar operador');
        },
        error: (err) => this.mostrarError(err.error?.mensaje || 'Error interno')
      });
    } else {
      this.operadoresService.crearOperador(this.formData as Operador).subscribe({
        next: (res) => {
          if (res.exito !== false) this.finalizarGuardado('Operador creado correctamente');
          else this.mostrarError(res.mensaje || 'Error al crear operador');
        },
        error: (err) => this.mostrarError(err.error?.mensaje || 'Error interno')
      });
    }
  }

  private async finalizarGuardado(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje, duration: 2500, color: 'success' });
    await toast.present();
    this.modalCtrl.dismiss(true);
  }

  private async mostrarError(mensaje: string) {
    const toast = await this.toastCtrl.create({ message: mensaje || 'Error interno', duration: 3000, color: 'danger' });
    await toast.present();
  }
}