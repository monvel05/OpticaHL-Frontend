import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, 
  IonContent, IonItem, IonInput, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonList, IonLabel, IonNote, IonSegment, IonSegmentButton,
  ModalController, IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  searchOutline, cashOutline, cardOutline, receiptOutline, 
  checkmarkCircleOutline, analyticsOutline, logOutOutline, documentTextOutline 
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';

// SERVICIOS REALES
import { OrdenService } from '../../core/services/orden.service';
import { CajaService } from '../../core/services/caja.service';

// MODAL DE PAGO CON SIGNALS
import { ModalPagoComponent } from '../../shared/components/modal-pago/modal-pago.component';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
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
    IonSegmentButton,
    IonMenuButton
  ]
})
export class CajaPage {
  private ordenService = inject(OrdenService);
  private cajaService = inject(CajaService);
  private modalCtrl = inject(ModalController);
  private authService = inject(AuthService);

  folioBusqueda = new FormControl('');
  ordenSeleccionada: any = null; 
  metodoPago: string = 'efectivo'; 
  esLiquidada: boolean = false;

  constructor() {
    addIcons({
      analyticsOutline,
      logOutOutline,
      searchOutline,
      cashOutline,
      cardOutline,
      receiptOutline,
      checkmarkCircleOutline,
      documentTextOutline
    });
  }

  /**
   * Busca la orden y evalúa si ya está liquidada
   */
  buscarOrden() {
    const folio = this.folioBusqueda.value;
    if (!folio || folio.trim() === '') return;

    const folioLimpio = folio.trim();
    console.log('Buscando folio en la óptica:', folioLimpio);

    this.ordenService.obtenerOrdenPorFolio(folioLimpio).subscribe({
      next: (respuesta: any) => {
        const datos = respuesta?.datos || respuesta;
        if (datos) {
          this.ordenSeleccionada = datos;
          
          // Evalúa si ya fue pagada según el estatus o saldo de la respuesta
          const saldoPendiente = datos.saldo !== undefined ? datos.saldo : (datos.total - (datos.anticipo || 0));
          this.esLiquidada = (datos.estatus === 'PAGADO' || saldoPendiente <= 0);
          
          if (this.esLiquidada) {
            alert('Aviso: Esta orden ya se encuentra liquidada completamente.');
          }
        } else {
          alert('No se encontró ninguna orden con ese folio.');
          this.ordenSeleccionada = null;
          this.esLiquidada = false;
        }
      },
      error: (err: any) => {
        console.error('Error al buscar la orden:', err);
        alert('No se encontró la orden o hubo un problema al conectar con el servidor.');
        this.ordenSeleccionada = null;
        this.esLiquidada = false;
      }
    });
  }

  /**
   * Abre el Modal de Cobro solo si la orden no está liquidada
   */
  async registrarPago() {
    if (!this.ordenSeleccionada || this.esLiquidada) return;

    const saldoCalculado = this.ordenSeleccionada.saldo !== undefined 
      ? this.ordenSeleccionada.saldo 
      : (this.ordenSeleccionada.total - (this.ordenSeleccionada.anticipo || 0));

    const modalPago = await this.modalCtrl.create({
      component: ModalPagoComponent,
      componentProps: {
        saldo: saldoCalculado
      }
    });

    await modalPago.present();

    const { data: pagoConfirmado, role } = await modalPago.onDidDismiss();

    if (role === 'confirm' && pagoConfirmado) {
      const folioOrdenPago = this.ordenSeleccionada.folio || this.ordenSeleccionada.folio_orden || this.folioBusqueda.value;

      const movimiento = {
        id_sucursal: 'HL01',
        id_operador: 1,
        folio_orden: folioOrdenPago,
        tipo_movimiento: 'INGRESO',
        metodo_pago: (pagoConfirmado.metodo || this.metodoPago).toUpperCase(),
        monto: pagoConfirmado.montoAbonado || saldoCalculado,
        concepto: `Liquidación de Orden - Cliente: ${this.ordenSeleccionada.paciente || this.ordenSeleccionada.paciente_nombre || 'Venta General'}`
      };

      this.cajaService.registrarMovimiento(movimiento).subscribe({
        next: () => {
          alert('¡Pago registrado con éxito!');
          
          // Preguntamos antes de limpiar la pantalla
          if (confirm('¿Deseas descargar e imprimir el Ticket PDF en este momento?')) {
            this.imprimirTicket(folioOrdenPago);
          }

          // Limpiar formulario y resetear estado
          this.ordenSeleccionada = null;
          this.folioBusqueda.setValue('');
          this.esLiquidada = false;
        },
        error: (err: any) => {
          console.error('Error al registrar dinero en caja:', err);
          alert(err.error?.mensaje || 'Error al procesar el pago en el servidor.');
        }
      });
    }
  }

  /**
   * Genera y abre el Ticket PDF evitando bloqueos de pop-up
   */
  imprimirTicket(folioParam?: string) {
    const folio = folioParam || this.ordenSeleccionada?.folio || this.ordenSeleccionada?.folio_orden;
    
    if (!folio) {
      alert('No hay un folio seleccionado para generar el ticket.');
      return;
    }

    // 1. Abrimos la pestaña INMEDIATAMENTE para evitar el bloqueo de ventanas emergentes del navegador
    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
      ventanaPDF.document.write('Cargando Ticket PDF...');
    }

    // 2. Solicitamos el Blob al backend
    this.cajaService.descargarTicketPDF(folio).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);

        if (ventanaPDF) {
          // Asignamos la URL del PDF a la ventana pre-abierta
          ventanaPDF.location.href = blobUrl;
        } else {
          // Respaldo de descarga forzada si la ventana emergente fue bloqueada por completo
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `Ticket_${folio}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      error: (err: any) => {
        if (ventanaPDF) ventanaPDF.close();
        console.error('Error descargando el ticket PDF:', err);
        alert('Error al descargar el ticket PDF. Verifique que cuenta con permisos.');
      }
    });
  }

  async logout() {
    await this.authService.logout();
  }
}