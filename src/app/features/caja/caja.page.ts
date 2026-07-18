import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, 
  IonContent, IonItem, IonInput, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonList, IonLabel, IonNote, IonSegment, IonSegmentButton,
  ModalController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, cashOutline, cardOutline, receiptOutline, checkmarkCircleOutline } from 'ionicons/icons';

// SERVICIOS REALES
import { OrdenService } from '../../core/services/orden.service';
import { CajaService } from '../../core/services/caja.service';

// TU MODAL DE PAGO CON SIGNALS
import { ModalPagoComponent } from '../../shared/components/modal-pago/modal-pago.component';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule, 
    ReactiveFormsModule, 
    RouterLink,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonContent, 
    IonItem, 
    IonInput, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonList, 
    IonLabel, 
    IonNote, 
    IonSegment, 
    IonSegmentButton
  ]
})
export class CajaPage {
  // Inyecciones modernas con inject()
  private ordenService = inject(OrdenService);
  private cajaService = inject(CajaService);
  private modalCtrl = inject(ModalController);

  folioBusqueda = new FormControl('');
  ordenSeleccionada: any = null; 
  metodoPago: string = 'efectivo'; // Vinculado dinámicamente al ion-segment

  constructor() {
    // Registro de los iconos necesarios en la vista de caja
    addIcons({ 
      searchOutline, 
      cashOutline, 
      cardOutline, 
      receiptOutline, 
      checkmarkCircleOutline 
    });
  }

  /**
   * Busca la orden real guardada previamente por el mostrador
   */
  buscarOrden() {
    // Aseguramos obtener el valor limpio y manejamos nulidad
    const folio = this.folioBusqueda.value;
    if (!folio || folio.trim() === '') return;

    console.log('Buscando folio en la óptica:', folio.trim());
    
    // Conectamos al método unificado en tu OrdenService
    this.ordenService.obtenerOrdenPorFolio(folio.trim()).subscribe({
      next: (orden: any) => {
        if (orden) {
          this.ordenSeleccionada = orden;
        } else {
          alert('No se encontró ninguna orden con ese folio o ya fue liquidada.');
          this.ordenSeleccionada = null;
        }
      },
      error: (err: any) => {
        console.error('Error al buscar la orden:', err);
        alert('Error al conectar con el servidor para buscar la orden.');
      }
    });
  }

  /**
   * Abre tu Modal de Cobro con Signals antes de impactar la caja general
   */
  async registrarPago() {
    if (!this.ordenSeleccionada) return;

    // Levantamos tu componente interactivo pasándole el total de la orden buscada
    const modalPago = await this.modalCtrl.create({
      component: ModalPagoComponent,
      componentProps: {
        saldo: this.ordenSeleccionada.total // Esto inicializa las Signals de tu calculadora de pago
      }
    });

    await modalPago.present();

    // Capturamos lo que arroja tu modal al cerrarse con las Signals
    const { data: pagoConfirmado, role } = await modalPago.onDidDismiss();

    // Si en tu modal con signals el cajero presionó "Confirmar Pago"
    if (role === 'confirm' && pagoConfirmado) {
      
      // Creamos el movimiento oficial para el flujo financiero utilizando
      // los datos reales calculados por tus Signals (metodo y monto reales) si existen
      const movimiento = {
        id_sucursal: 'HL01',
        id_operador: 1, // Id del Cajero en turno
        folio_orden: this.ordenSeleccionada.folio || this.ordenSeleccionada.id_orden || this.folioBusqueda.value,
        tipo_movimiento: 'INGRESO',
        // Prioriza el método de pago que calculó el modal interactivo, de lo contrario toma el del segmento
        metodo_pago: (pagoConfirmado.metodo || this.metodoPago).toUpperCase(), 
        // Prioriza el monto exacto cobrado reportado por tus Signals
        monto: pagoConfirmado.montoAbonado || this.ordenSeleccionada.total,
        concepto: `Liquidación de Orden - Cliente: ${this.ordenSeleccionada.cliente || 'Venta General'}`
      };

      // Guardamos en la base de datos el ingreso de dinero a la caja chica
      this.cajaService.registrarMovimiento(movimiento).subscribe({
        next: (res: any) => {
          alert('¡Pago registrado con éxito en Caja! Orden finalizada de forma correcta.');
          
          // Reseteamos y limpiamos la pantalla para el siguiente cliente en fila
          this.ordenSeleccionada = null;
          this.folioBusqueda.setValue('');
        },
        error: (err: any) => {
          console.error('Error al registrar dinero en caja:', err);
          alert('Error crítico al procesar el ingreso financiero en el servidor.');
        }
      });
    }
  }
}