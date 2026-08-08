import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonIcon,
  IonButtons, IonSearchbar, IonButton, IonGrid, IonRow, IonCol,
  IonCard, IonItem, IonAvatar, IonLabel, IonFabButton, IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

// Servicios
import { AuthService } from 'src/app/core/services/auth.service';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../shared/interfaces/cliente.interface';

// Componentes de Modales
import { ClienteFormComponent } from '../../shared/components/cliente-form/cliente-form.component';
import { HistorialOrdenComponent } from '../../shared/components/historial-orden/historial-orden.component';
import { CrritoPage } from '../crrito/crrito.page';

// Iconos requeridos
import {
  refreshOutline,
  searchOutline,
  callOutline,
  folderOpenOutline,
  documentTextOutline,
  personAdd,
  closeOutline,
  checkmarkCircleOutline,
  logOutOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-mostrador',
  templateUrl: './mostrador.page.html',
  styleUrls: ['./mostrador.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonFabButton, IonLabel, IonAvatar, IonItem, IonCard, IonCol,
    IonRow, IonGrid, IonButton, IonSearchbar, IonButtons, IonIcon,
    IonFab, IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule
  ]
})
export class MostradorPage implements OnInit {
  // Inyección de dependencias
  private clienteService = inject(ClienteService);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);

  searchTerm: string = '';
  clientesFiltrados: Cliente[] = [];

  constructor() {
    addIcons({
      refreshOutline,
      logOutOutline,
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
   * Cierra la sesión activa del usuario
   */
  async logout() {
    await this.authService.logout();
  }

  /**
   * Escucha el buscador del mostrador y solicita coincidencias al Backend en tiempo real.
   */
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';

    if (this.searchTerm.trim() === '') {
      this.clientesFiltrados = [];
      return;
    }

    this.clienteService.buscarClientes(this.searchTerm).subscribe({
      next: (data: any) => {
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
   * 🎯 VER HISTORIAL: Abre el modal pasando las listas separadas de clínico y materiales
   */
  verHistorial(cliente: Cliente) {
    if (!cliente.id_cliente) return;

    this.clienteService.obtenerHistorial(cliente.id_cliente).subscribe({
      next: async (res: any) => {
        // Extraemos clinico y materiales del objeto `data` de la respuesta
        const clinico = res?.data?.clinico || (Array.isArray(res) ? res : []);
        const materiales = res?.data?.materiales || [];

        const modal = await this.modalCtrl.create({
          component: HistorialOrdenComponent,
          componentProps: {
            nombreCliente: cliente.nombre_completo,
            historialClinico: clinico,
            historialMateriales: materiales
          }
        });

        await modal.present();
      },
      error: (err: any) => console.error('Error al obtener el historial del cliente:', err)
    });
  }

  /**
   * 🔥 CREAR ORDEN COMMERCIAL: Extrae la última graduación y la envía al carrito.
   */
  async crearOrden(cliente: Cliente) {
    if (!cliente.id_cliente) return;

    console.log('Mostrador: Solicitando última receta para:', cliente.nombre_completo);

    this.clienteService.obtenerHistorial(cliente.id_cliente).subscribe({
      next: async (res: any) => {
        // Extraemos las recetas clínicas de la respuesta estructurada
        const listaClinica = res?.data?.clinico || (Array.isArray(res) ? res : []);

        // ⚠️ Si el cliente no tiene refracciones hechas por el optometrista, lo bloqueamos
        if (!listaClinica || listaClinica.length === 0) {
          alert(`El cliente ${cliente.nombre_completo} no tiene ninguna graduación registrada por el Optometrista. Por favor, solicite primero su consulta clínica en Gabinete.`);
          return;
        }

        // 🥇 Tomamos la receta más reciente
        const ultimaReceta = listaClinica[0];
        console.log('✅ Receta recuperada con éxito para enlazar:', ultimaReceta);

        const modalCarrito = await this.modalCtrl.create({
          component: CrritoPage,
          componentProps: {
            cliente: cliente,
            folioRx: ultimaReceta.folio || 'RX-' + cliente.id_cliente,
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
    const modal = await this.modalCtrl.create({
      component: ClienteFormComponent,
      cssClass: 'modal-formulario-cliente'
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data) {
      this.clientesFiltrados = [data];
      this.searchTerm = data.nombre_completo;
    }
  }
}