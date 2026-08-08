import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonListHeader, IonLabel, 
  IonCard, IonCardContent, IonSearchbar, IonList, IonItem, IonAvatar, 
  IonIcon, IonSpinner, IonButton, IonGrid, IonRow, IonCol, IonButtons,
  ModalController, AlertController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline, checkmarkCircleOutline, eyeOutline, searchOutline, addCircleOutline, timeOutline, createOutline, logOutOutline } from 'ionicons/icons';
import { HistorialOrdenComponent } from '../../shared/components/historial-orden/historial-orden.component'; 
import { ClienteService } from '../../core/services/cliente.service'; 
import { Cliente } from '../../shared/interfaces/cliente.interface';
import { ClienteFormComponent } from '../../shared/components/cliente-form/cliente-form.component';
import { FormularioRecetaComponent } from '../../shared/components/formulario-receta/formulario-receta.component';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-optometrista',
  templateUrl: './optometrista.page.html',
  styleUrls: ['./optometrista.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonListHeader, IonLabel, 
    IonCard, IonCardContent, IonSearchbar, IonList, IonItem, IonAvatar, 
    IonIcon, IonSpinner, IonButton, IonGrid, IonRow, IonCol, IonButtons // 👈 Agregado para soportar ion-buttons slot="end"
  ]
})
export class OptometristaPage {
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private clienteService = inject(ClienteService); 
  private authService = inject(AuthService); // 👈 Inyección agregada

  public pacienteSeleccionado: any = null;
  public resultadosBusqueda: Cliente[] = []; 
  public cargando: boolean = false;

  constructor() {
    addIcons({logOutOutline,eyeOutline,personAddOutline,checkmarkCircleOutline,addCircleOutline,timeOutline,createOutline,searchOutline});
  }

  /**
   * 1. Abre el modal para registrar un paciente nuevo en SQL
   */
  async abrirModalNuevoPaciente() {
    const modal = await this.modalCtrl.create({
      component: ClienteFormComponent
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.pacienteSeleccionado = data;
    }
  }

  /**
   * 2. Abre el modal de la Receta pasándole el paciente mediante props
   */
  async abrirModalReceta() {
    if (!this.pacienteSeleccionado) return;

    const modal = await this.modalCtrl.create({
      component: FormularioRecetaComponent,
      componentProps: {
        cliente: this.pacienteSeleccionado 
      }
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      this.mostrarAlertaExito();
      this.pacienteSeleccionado = null;
      this.resultadosBusqueda = []; 
    }
  }

  /**
   * 🔍 BUSCADOR EN TIEMPO REAL: Conexión con tu ClienteService
   */
  buscarPacienteExistente(event: any) {
    const query = event.detail?.value || event.target?.value || '';

    if (!query || query.trim() === '') {
      this.resultadosBusqueda = [];
      return;
    }

    this.cargando = true;

    this.clienteService.buscarClientes(query).subscribe({
      next: (response: any) => {
        console.log('Pacientes encontrados en gabinete:', response);
        this.resultadosBusqueda = response && response.data ? response.data : [];
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al realizar búsqueda en gabinete:', err);
        this.resultadosBusqueda = [];
        this.cargando = false;
      }
    });
  }

  /**
   * 🎯 Selecciona un paciente de la lista de resultados
   */
  seleccionarPaciente(paciente: Cliente) {
    console.log('Paciente seleccionado para consulta:', paciente);
    this.pacienteSeleccionado = paciente;
    this.resultadosBusqueda = []; 
  }

  async mostrarAlertaExito() {
    const alert = await this.alertCtrl.create({
      header: '¡Consulta Guardada!',
      message: 'La receta clínica (Rx) fue guardada en MySQL de manera exitosa y está lista en mostrador.',
      buttons: ['Excelente'],
    });
    await alert.present();
  }

  /**
   * 🔄 EDITAR ÚLTIMA RECETA (Evolución Clínica sin sobreescribir)
   */
  async editarUltimaReceta() {
    if (!this.pacienteSeleccionado || !this.pacienteSeleccionado.id_cliente) return;

    this.cargando = true;

    this.clienteService.obtenerUltimaRX(this.pacienteSeleccionado.id_cliente).subscribe({
      next: async (response: any) => {
        this.cargando = false;

        if (response.success && response.data) {
          const modal = await this.modalCtrl.create({
            component: FormularioRecetaComponent,
            componentProps: {
              cliente: this.pacienteSeleccionado,
              datosPreexistentes: response.data 
            }
          });

          await modal.present();
          const { data, role } = await modal.onWillDismiss();

          if (role === 'confirm') {
            this.mostrarAlertaExito();
            this.pacienteSeleccionado = null;
            this.resultadosBusqueda = [];
          }
        }
      },
      error: async (err: any) => {
        this.cargando = false;
        console.error('Error al recuperar última Rx:', err);
        
        const alert = await this.alertCtrl.create({
          header: 'Sin registros',
          message: 'Este paciente no cuenta con un historial de recetas previo para usar como plantilla.',
          buttons: ['Entendido']
        });
        await alert.present();
      }
    });
  }

  /**
   * 🕒 VER HISTORIAL CLÍNICO
   */
  verHistorialClinico() {
    if (!this.pacienteSeleccionado || !this.pacienteSeleccionado.id_cliente) return;

    this.cargando = true;

    this.clienteService.obtenerHistorial(this.pacienteSeleccionado.id_cliente).subscribe({
      next: async (historial: any[]) => {
        this.cargando = false;

        const modal = await this.modalCtrl.create({
          component: HistorialOrdenComponent,
          componentProps: {
            historialRaw: historial,
            nombreCliente: this.pacienteSeleccionado.nombre_completo
          }
        });

        await modal.present();
      },
      error: (err) => {
        console.error('Error al recuperar el historial clínico:', err);
        this.cargando = false;
      }
    });
  }

  /**
   * 🚪 Cierra la sesión activa del usuario
   */
  async logout() {
    await this.authService.logout();
  }
}