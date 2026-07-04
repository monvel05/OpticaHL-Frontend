import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonicModule, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
// 🎯 ACTUALIZADO: Agregamos todos los iconos que usan tus 3 nuevos botones
import { personAddOutline, checkmarkCircleOutline, eyeOutline, searchOutline, addCircleOutline, timeOutline, createOutline } from 'ionicons/icons';
import { HistorialOrdenComponent } from '../../shared/components/historial-orden/historial-orden.component'; // Verifica tu ruta exacta
// 📂 Importamos tu servicio e interfaz correspondientes
import { ClienteService } from '../../core/services/cliente.service'; 
import { Cliente } from '../../shared/interfaces/cliente.interface';

// 📂 Importamos tus componentes de modales existentes
import { ClienteFormComponent } from '../../shared/components/cliente-form/cliente-form.component';
import { FormularioRecetaComponent } from '../../shared/components/formulario-receta/formulario-receta.component';

@Component({
  selector: 'app-optometrista',
  templateUrl: './optometrista.page.html',
  styleUrls: ['./optometrista.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class OptometristaPage {
  // Inyección de dependencias limpia usando inject()
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private clienteService = inject(ClienteService); 

  public pacienteSeleccionado: any = null;
  public resultadosBusqueda: Cliente[] = []; 
  public cargando: boolean = false;

  constructor() {
    // 🎯 ACTUALIZADO: Registramos todos los iconos nuevos en el constructor
    addIcons({ 
      personAddOutline, 
      checkmarkCircleOutline, 
      eyeOutline, 
      searchOutline,
      addCircleOutline,
      timeOutline,
      createOutline
    });
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

    // 🎯 CORREGIDO: Al crear un paciente nuevo, solo lo seleccionamos. 
    // Quitamos el 'this.abrirModalReceta()' para que cargue la tarjeta con los 3 botones.
    if (role === 'confirm' && data) {
      this.pacienteSeleccionado = data;
    }
  }

  /**
   * 2. Abre el modal de la Receta pasándole el paciente mediante props
   * (Este se ejecuta cuando haces clic en el botón verde de "Nueva Consulta (Rx)")
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
      this.resultadosBusqueda = []; // Limpiamos la lista de búsqueda para la siguiente consulta
    }
  }

  /**
   * 🔍 BUSCADOR EN TIEMPO REAL: Conexión nativa con tu ClienteService
   */
  buscarPacienteExistente(event: any) {
    const query = event.detail?.value || event.target?.value || '';

    if (!query || query.trim() === '') {
      this.resultadosBusqueda = [];
      return;
    }

    this.cargando = true;

    this.clienteService.buscarClientes(query).subscribe({
      next: (data: Cliente[]) => {
        console.log('Pacientes encontrados en gabinete:', data);
        this.resultadosBusqueda = data;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error al realizar búsqueda en gabinete:', err);
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
    this.resultadosBusqueda = []; // Ocultamos la lista limpiando el arreglo
    
    // 🎯 CORREGIDO: ¡Eliminado 'this.abrirModalReceta()'! 
    // Ahora al tocar el paciente se quedará congelado en la pantalla de opciones tal como quieres.
  }

  async mostrarAlertaExito() {
    const alert = await this.alertCtrl.create({
      header: '¡Consulta Guardada!',
      message: 'La receta clínica (Rx) fue guardada en MySQL de manera exitosa y está lista en mostrador.',
      buttons: ['Excelente'],
    });
    await alert.present();
  }
  editarUltimaReceta() {
    console.log('Cargando última Rx para editar del cliente:', this.pacienteSeleccionado.id_cliente);
    // Aquí irá tu lógica para traer la última consulta de la BD y mandarla a editar
  }
  verHistorialClinico() {
    if (!this.pacienteSeleccionado || !this.pacienteSeleccionado.id_cliente) return;

    this.cargando = true;

    // 🌐 Consultamos el backend usando tu servicio existente
    this.clienteService.obtenerHistorial(this.pacienteSeleccionado.id_cliente).subscribe({
      next: async (historial: any[]) => {
        this.cargando = false;

        // Lanzamos la modal pasándole los parámetros requeridos
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
}