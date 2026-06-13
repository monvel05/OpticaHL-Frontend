import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonIcon, 
  IonButtons, IonSearchbar, IonButton, IonGrid, IonRow, IonCol, 
  IonCard, IonItem, IonAvatar, IonLabel, IonFabButton 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

import { ClienteService } from '../../core/services/cliente.service'; 
import { Cliente } from '../../shared/interfaces/cliente.interface';

// IMPORTACIONES DE COMPONENTES DE MODALES
import { ClienteFormComponent } from '../../shared/components/cliente-form/cliente-form.component';
import { FormularioRecetaComponent } from '../../shared/components/formulario-receta/formulario-receta.component';
import { HistorialOrdenComponent } from '../../shared/components/historial-orden/historial-orden.component';
import { CrritoPage } from '../crrito/crrito.page';

// ICONOS REQUERIDOS
import { 
  refreshOutline, 
  searchOutline, 
  callOutline, 
  folderOpenOutline, 
  documentTextOutline, 
  personAdd,
  closeOutline,
  checkmarkCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-mostrador',
  templateUrl: './mostrador.page.html',
  styleUrls: ['./mostrador.page.scss'],
  standalone: true,
  imports: [
    IonFabButton, IonLabel, IonAvatar, IonItem, IonCard, IonCol, 
    IonRow, IonGrid, IonButton, IonSearchbar, IonButtons, IonIcon, 
    IonFab, IonContent, IonHeader, IonTitle, IonToolbar, 
    CommonModule, FormsModule
  ]
})
export class MostradorPage implements OnInit {
  private clienteService = inject(ClienteService);
  private modalCtrl = inject(ModalController);

  searchTerm: string = '';
  clientesFiltrados: Cliente[] = [];

  constructor() {
    // Registramos todos los iconos necesarios globales y de modales hijos
    addIcons({
      refreshOutline,
      searchOutline,
      callOutline,
      folderOpenOutline,
      documentTextOutline,
      personAdd,
      closeOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.clientesFiltrados = [];
  }

  /**
   * Escucha el buscador del mostrador y solicita coincidencias al Backend en tiempo real
   */
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';

    if (this.searchTerm.trim() === '') {
      this.clientesFiltrados = [];
      return;
    }

    this.clienteService.buscarClientes(this.searchTerm).subscribe({
      next: (data: Cliente[]) => {
        this.clientesFiltrados = data;
      },
      error: (err: any) => console.error('Error al realizar búsqueda en el mostrador:', err)
    });
  }

  /**
   * Refresca la cuadrícula del mostrador con el término de búsqueda actual
   */
  cargarClientes() {
    if (this.searchTerm.trim() !== '') {
      this.onSearchChange({ detail: { value: this.searchTerm } });
    }
  }

  /**
   * Helper para extraer la inicial estética del cliente en la lista
   */
  obtenerInicial(nombreCompleto: string): string {
    if (!nombreCompleto) return 'C';
    return nombreCompleto.trim().charAt(0).toUpperCase();
  }

  /**
   * HISTORIAL: Recupera el historial clínico de refracciones previas y abre el modal descriptivo
   */
  verHistorial(cliente: Cliente) {
    if (!cliente.id_cliente) return;

    // Se agrega el tipado ": any" a las respuestas para evitar que TypeScript marque error de compilación
    this.clienteService.obtenerHistorial(cliente.id_cliente).subscribe({
      next: (historial: any[]) => {
        // Levantamos el modal pasándole el arreglo de la BD
        this.abrirModalHistorial(cliente.nombre_completo, historial);
      },
      error: (err: any) => console.error('Error al obtener el historial clínico:', err)
    });
  }

  /**
   * Helper para instanciar el modal de historial de forma limpia
   */
  async abrirModalHistorial(nombreCliente: string, historialRaw: any[]) {
    const modal = await this.modalCtrl.create({
      component: HistorialOrdenComponent,
      componentProps: {
        nombreCliente: nombreCliente,
        historialRaw: historialRaw
      }
    });
    await modal.present();
  }

  /**
   * ACCIÓN: NUEVA ORDEN (Flujo Clínico -> Flujo Comercial en Cascada con el Carrito)
   */
  async crearOrden(cliente: Cliente) {
    console.log('Abriendo panel de refracción clínica para:', cliente);

    // FASE 1: Guardar receta médica
    const modalReceta = await this.modalCtrl.create({
      component: FormularioRecetaComponent,
      componentProps: { cliente: cliente }
    });
    await modalReceta.present();

    const resultReceta = await modalReceta.onDidDismiss();

    // Si la consulta médica se grabó con éxito
    if (resultReceta.role === 'confirm' && resultReceta.data) {
      const folioClinico = resultReceta.data.folio || 'RX-' + Math.floor(1000 + Math.random() * 9000);
      console.log('¡Receta lista! Abriendo de inmediato el carrito con folio:', folioClinico);

      // FASE 2: Levantar el carrito de compras pasando los datos en cascada
      const modalCarrito = await this.modalCtrl.create({
        component: CrritoPage, 
        componentProps: {
          cliente: cliente,
          folioRx: folioClinico
        }
      });
      await modalCarrito.present();

      const resultCarrito = await modalCarrito.onDidDismiss();
      if (resultCarrito.role === 'confirm') {
        // Ciclo completo cerrado con éxito: limpiamos el mostrador para el siguiente paciente
        this.clientesFiltrados = [];
        this.searchTerm = '';
      }
    }
  }

  /**
   * ACCIÓN: REGISTRAR NUEVO CLIENTE (Alta rápida desde el mostrador)
   */
  async registrarNuevoCliente() {
    console.log('Abriendo modal del formulario de alta rápida...');

    const modal = await this.modalCtrl.create({
      component: ClienteFormComponent,
      cssClass: 'modal-formulario-cliente'
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data) {
      // Enfocamos al mostrador en el nuevo cliente creado
      this.clientesFiltrados = [data];
      this.searchTerm = data.nombre_completo;
      console.log('Mostrador enfocado en el nuevo paciente registrado:', data);
    }
  }
}