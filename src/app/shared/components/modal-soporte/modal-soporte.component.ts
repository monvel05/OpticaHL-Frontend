import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonButtons, IonItem, IonLabel, IonTextarea, IonIcon, 
  IonList, IonItemDivider, IonRadioGroup, IonRadio,
  IonSpinner, ModalController, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  helpBuoyOutline, warningOutline, bulbOutline, 
  sendOutline, closeOutline, checkmarkCircleOutline, alertCircleOutline 
} from 'ionicons/icons';
import { AuthService, Usuario } from '../../../core/services/auth.service';
import { SoporteService } from '../../../core/services/soporte.service';

@Component({
  selector: 'app-modal-soporte',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonItem,
    IonLabel,
    IonTextarea,
    IonIcon,
    IonList,
    IonItemDivider,
    IonRadioGroup,
    IonRadio,
    IonSpinner
  ],
  templateUrl: './modal-soporte.component.html',
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
export class ModalSoporteComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private authService = inject(AuthService);
  private soporteService = inject(SoporteService);

  @Input() rutaActual: string = '';

  public usuario: Usuario | null = null;
  public tipoReporte: 'falla' | 'funcion' = 'falla';
  public descripcion: string = '';
  public enviando: boolean = false;

  constructor() {
    addIcons({
      helpBuoyOutline,
      warningOutline,
      bulbOutline,
      sendOutline,
      closeOutline,
      checkmarkCircleOutline,
      alertCircleOutline
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
    });
  }

  get nombreSolicitante(): string {
    if (!this.usuario) return 'Usuario del Sistema';
    const u = this.usuario as any;
    return u.nombre_completo || u.nombre || u.usuario_login || u.usuario || 'Usuario del Sistema';
  }

  get rolUsuario(): string {
    if (!this.usuario) return 'Usuario';
    const roles = Array.isArray(this.usuario.roles) 
      ? this.usuario.roles.join(', ') 
      : ((this.usuario as any).rol || 'Usuario');
    return roles || 'Usuario';
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async enviar() {
    if (!this.descripcion || !this.descripcion.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor ingresa una descripción para tu reporte.',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.enviando = true;

    const operadorData = {
      ...this.usuario,
      nombre_completo: this.nombreSolicitante,
      nombre: this.nombreSolicitante,
      usuario_login: (this.usuario as any)?.usuario_login || (this.usuario as any)?.usuario || 'N/A',
      roles: Array.isArray(this.usuario?.roles) ? this.usuario?.roles : [this.rolUsuario]
    };

    this.soporteService.enviarReporte({
      tipo: this.tipoReporte,
      descripcion: this.descripcion.trim(),
      operador: operadorData,
      sucursal: this.usuario?.id_sucursal || 'General',
      rutaActual: this.rutaActual || 'N/A'
    }).subscribe({
      next: async () => {
        this.enviando = false;
        const toast = await this.toastCtrl.create({
          message: '✓ Tu reporte ha sido enviado con éxito a soporte@opthospitaldelentes.com',
          duration: 4000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
        this.modalCtrl.dismiss({ enviado: true });
      },
      error: async (err) => {
        this.enviando = false;
        console.error('Error al enviar reporte a soporte:', err);
        const toast = await this.toastCtrl.create({
          message: 'No se pudo enviar el reporte por correo. Por favor verifica tu conexión o intenta más tarde.',
          duration: 4000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }
}
