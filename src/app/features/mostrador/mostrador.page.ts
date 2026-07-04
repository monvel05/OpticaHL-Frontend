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
   * Escucha el buscador del mostrador y solicita coincidencias al Backend en tiempo real.
   * Cuenta con blindaje para evitar errores de iteración si el backend cambia su estructura.
   */
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';

    if (this.searchTerm.trim() === '') {
      this.clientesFiltrados = [];
      return;
    }

    this.clienteService.buscarClientes(this.searchTerm).subscribe({
      next: (data: any) => {
        console.log('🔍 Datos recibidos en buscador de mostrador:', data);

        // 🛡️ VALIDACIÓN EN CASCADA (Evita el crash de "Symbol.iterator")
        if (Array.isArray(data)) {
          this.clientesFiltrados = data;
        } else if (data && Array.isArray(data.clientes)) {
          this.clientesFiltrados = data.clientes;
        } else if (data && Array.isArray(data.data)) {
          this.clientesFiltrados = data.data;
        } else {
          this.clientesFiltrados = [];
        }
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

    this.clienteService.obtenerHistorial(cliente.id_cliente).subscribe({
      next: (historial: any[]) => {
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
   * 🔥 ACCIÓN ACTUALIZADA: NUEVA ORDEN COMMERCIAL
   * Obtiene la receta más reciente en modo lectura y la transfiere directamente al carrito.
   */
  async crearOrden(cliente: Cliente) {
    if (!cliente.id_cliente) return;

    console.log('Mostrador: Solicitando última receta para:', cliente.nombre_completo);

    // 🌐 Consultamos el historial del cliente para extraer su graduación vigente
    this.clienteService.obtenerHistorial(cliente.id_cliente).subscribe({
      next: async (historial: any[]) => {
        
        // ⚠️ Si el cliente no tiene refracciones hechas por el optometrista, lo bloqueamos
        if (!historial || historial.length === 0) {
          alert(`El cliente ${cliente.nombre_completo} no tiene ninguna graduación registrada por el Optometrista. Por favor, solicite primero su consulta clínica en Gabinete.`);
          return;
        }

        // 🥇 Tomamos la primera posición (la receta más reciente de la base de datos)
        const ultimaReceta = historial[0];
        console.log('✅ Receta recuperada con éxito para enlazar:', ultimaReceta);

        // FASE COMERCIAL: Saltamos de inmediato al Carrito enviándole los datos del cliente y de su receta
        const modalCarrito = await this.modalCtrl.create({
          component: CrritoPage, 
          componentProps: {
            cliente: cliente,
            folioRx: ultimaReceta.folio || 'RX-' + ultimaReceta.id_graduacion,
            // Pasamos el paquete completo de la graduación para que el Carrito lo muestre congelado (Solo lectura)
            graduacionLectura: {
              od_esfera: ultimaReceta.od_esfera,
              od_cilindro: ultimaReceta.od_cilindro,
              od_eje: ultimaReceta.od_eje,
              od_adicion: ultimaReceta.od_adicion,
              oi_esfera: ultimaReceta.oi_esfera,
              oi_cilindro: ultimaReceta.oi_cilindro,
              oi_eje: ultimaReceta.oi_eje,
              oi_adicion: ultimaReceta.oi_adicion,
              observaciones: ultimaReceta.observaciones || 'Sin notas adicionales.'
            }
          }
        });

        await modalCarrito.present();

        const resultCarrito = await modalCarrito.onDidDismiss();
        if (resultCarrito.role === 'confirm') {
          // Si la venta concluyó con éxito, limpiamos el mostrador
          this.clientesFiltrados = [];
          this.searchTerm = '';
        }
      },
      error: (err: any) => {
        console.error('Error crítico al enlazar la orden comercial:', err);
        alert('Hubo un inconveniente al conectar con el servidor para obtener la receta.');
      }
    });
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
      this.clientesFiltrados = [data];
      this.searchTerm = data.nombre_completo;
      console.log('Mostrador enfocado en el nuevo paciente registrado:', data);
    }
  }
}