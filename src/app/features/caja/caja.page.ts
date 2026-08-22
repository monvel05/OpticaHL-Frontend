import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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

// MODAL DE PAGO
import { ModalPagoComponent } from '../../shared/components/modal-pago/modal-pago.component';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    CommonModule,
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
  private cdr = inject(ChangeDetectorRef); // Inyectamos la detección de cambios

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

  buscarOrden() {
    const folio = this.folioBusqueda.value;
    if (!folio || folio.trim() === '') return;

    const folioLimpio = folio.trim();

    this.ordenService.obtenerOrdenPorFolio(folioLimpio).subscribe({
      next: (respuesta: any) => {
        const datos = respuesta?.datos || respuesta;

        if (datos) {
          const total = Number(datos.total || datos.total_general || 0);
          const anticipo = Number(datos.anticipo ?? datos.monto_abonado ?? datos.total_pagado ?? 0);
          const saldoCalculado = datos.saldo !== undefined ? Number(datos.saldo) : Math.max(0, total - anticipo);

          this.ordenSeleccionada = {
            ...datos,
            total: total,
            anticipo: anticipo,
            saldo: saldoCalculado
          };

          this.esLiquidada = (datos.estatus === 'PAGADO' || datos.estatus === 'LIQUIDADO' || saldoCalculado <= 0);

          if (this.esLiquidada) {
            alert('Aviso: Esta orden ya se encuentra liquidada completamente.');
          }
        } else {
          alert('No se encontró ninguna orden con ese folio.');
          this.limpiarPantalla();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Error al buscar la orden:', err);
        alert('No se encontró la orden o hubo un problema al conectar con el servidor.');
        this.limpiarPantalla();
      }
    });
  }

  async registrarPago() {
    if (!this.ordenSeleccionada || this.esLiquidada) return;

    const totalGeneral = Number(this.ordenSeleccionada.total || 0);
    const anticipoAcumulado = Number(this.ordenSeleccionada.anticipo || 0);
    const saldoCalculado = Number(this.ordenSeleccionada.saldo ?? (totalGeneral - anticipoAcumulado));

    const modalPago = await this.modalCtrl.create({
      component: ModalPagoComponent,
      componentProps: {
        saldo: saldoCalculado,
        total: totalGeneral,
        anticipoPrevio: anticipoAcumulado
      }
    });

    await modalPago.present();

    const { data: pagoConfirmado, role } = await modalPago.onDidDismiss();

    if (role === 'confirm' && pagoConfirmado) {
      const folioOrdenPago = this.ordenSeleccionada.folio || this.ordenSeleccionada.folio_orden || this.folioBusqueda.value;
      const montoAbono = Number(pagoConfirmado.montoAbonado);
      const nuevoSaldo = Math.max(0, saldoCalculado - montoAbono);

      const esPagoTotal = nuevoSaldo <= 0;
      const conceptoMovimiento = esPagoTotal
        ? `Pago Total de Orden - Cliente: ${this.ordenSeleccionada.paciente || this.ordenSeleccionada.paciente_nombre || 'Venta General'}`
        : `Abono/Anticipo a Orden - Cliente: ${this.ordenSeleccionada.paciente || this.ordenSeleccionada.paciente_nombre || 'Venta General'}`;

      const movimiento = {
        id_sucursal: 'HL01',
        id_operador: 1,
        folio_orden: folioOrdenPago,
        tipo_movimiento: 'INGRESO',
        metodo_pago: (pagoConfirmado.metodo || this.metodoPago).toUpperCase(),
        monto: montoAbono,
        concepto: conceptoMovimiento
      };

      this.cajaService.registrarMovimiento(movimiento).subscribe({
        next: () => {
          alert('¡Pago registrado con éxito!');

          // Preguntar por la impresión del ticket
          if (confirm('¿Deseas descargar e imprimir el Ticket PDF en este momento?')) {
            this.imprimirTicket(folioOrdenPago);
          }

          // LIMPIA LA PANTALLA INMEDIATAMENTE
          this.limpiarPantalla();
        },
        error: (err: any) => {
          console.error('❌ Error al registrar dinero en caja:', err);
          alert(err.error?.mensaje || 'Error al procesar el pago en el servidor.');
        }
      });
    }
  }

  /**
   * Resetea el buscador y la orden seleccionada en la vista de caja
   */
  limpiarPantalla() {
    this.folioBusqueda.setValue('');
    this.ordenSeleccionada = null;
    this.esLiquidada = false;
    this.cdr.detectChanges(); // Forzar la actualización inmediata de la UI
  }

  imprimirTicket(folioParam?: string) {
    const folio = folioParam || this.ordenSeleccionada?.folio || this.ordenSeleccionada?.folio_orden;

    if (!folio) {
      alert('No hay un folio seleccionado para generar el ticket.');
      return;
    }

    const ventanaPDF = window.open('', '_blank');
    if (ventanaPDF) {
      ventanaPDF.document.write('Cargando Ticket PDF...');
    }

    this.cajaService.descargarTicketPDF(folio).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);

        if (ventanaPDF) {
          ventanaPDF.location.href = blobUrl;
        } else {
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
        console.error('❌ Error descargando el ticket PDF:', err);
        alert('Error al descargar el ticket PDF. Verifique que cuenta con permisos.');
      }
    });
  }

  async logout() {
    await this.authService.logout();
  }
}