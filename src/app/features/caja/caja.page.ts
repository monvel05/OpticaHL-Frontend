import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonItem, IonInput, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonList, IonLabel, IonNote, ModalController, IonMenuButton, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, cashOutline, cardOutline, receiptOutline,
  checkmarkCircleOutline, analyticsOutline, logOutOutline, documentTextOutline, timeOutline,
  arrowBackOutline, flashOutline
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';

// SERVICIOS REALES
import { OrdenService } from '../../core/services/orden.service';
import { CajaService } from '../../core/services/caja.service';

// MODALES
import { ModalPagoComponent } from '../../shared/components/modal-pago/modal-pago.component';
import { ModalCobroRapidoComponent } from '../../shared/components/modalcobrorapido/modalcobrorapido.component';

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
    IonMenuButton
  ]
})
export class CajaPage implements OnInit {
  private ordenService = inject(OrdenService);
  private cajaService = inject(CajaService);
  private modalCtrl = inject(ModalController);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private alertCtrl = inject(AlertController);

  folioBusqueda = new FormControl('');
  ordenSeleccionada: any = null;
  ultimasOrdenes: any[] = [];
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
      documentTextOutline,
      timeOutline,
      arrowBackOutline,
      flashOutline
    });
  }

  ngOnInit() {
    this.cargarUltimasOrdenes();
  }

  ionViewWillEnter() {
    this.cargarUltimasOrdenes();
  }

  /**
   * Carga y ordena las últimas órdenes registrándolas de la más reciente a la más antigua
   */
  cargarUltimasOrdenes() {
    this.ordenService.obtenerOrdenes().subscribe({
      next: (res: any) => {
        const lista: any[] = res?.datos || res || [];

        if (Array.isArray(lista)) {
          const listaOrdenada = [...lista].sort((a, b) => {
            const fechaA = new Date(a.fecha_emision || a.fecha_creacion || a.created_at || 0).getTime();
            const fechaB = new Date(b.fecha_emision || b.fecha_creacion || b.created_at || 0).getTime();

            if (fechaA !== fechaB) return fechaB - fechaA;

            const folioA = String(a.folio_orden || a.folio || '');
            const folioB = String(b.folio_orden || b.folio || '');
            return folioB.localeCompare(folioA, undefined, { numeric: true, sensitivity: 'base' });
          });

          this.ultimasOrdenes = listaOrdenada.slice(0, 5);
        } else {
          this.ultimasOrdenes = [];
        }

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar órdenes recientes:', err);
      }
    });
  }

  seleccionarOrdenRapida(folio: string) {
    this.folioBusqueda.setValue(folio);
    this.buscarOrden();
  }

  /**
   * Realiza la búsqueda de orden por folio o por nombre de cliente/paciente
   */
  buscarOrden() {
    const termino = this.folioBusqueda.value;
    if (!termino || termino.trim() === '') return;

    const terminoLimpio = termino.trim();

    this.ordenService.obtenerOrdenPorFolio(terminoLimpio).subscribe({
      next: (respuesta: any) => {
        const datos = respuesta?.datos || respuesta;

        if (datos && (datos.folio_orden || datos.folio)) {
          this.procesarOrdenSeleccionada(datos);
        } else {
          this.buscarPorNombreOTexto(terminoLimpio);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscarPorNombreOTexto(terminoLimpio);
      }
    });
  }

  private procesarOrdenSeleccionada(datos: any) {
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
      window.alert('Aviso: Esta orden ya se encuentra liquidada completamente.');
    }
  }

  private buscarPorNombreOTexto(termino: string) {
    const terminoLower = termino.toLowerCase();

    this.ordenService.obtenerOrdenes().subscribe({
      next: (res: any) => {
        const lista: any[] = res?.datos || res || [];

        const coincidencia = lista.find((ord: any) => {
          const nombre = String(ord.paciente || ord.paciente_nombre || ord.cliente || '').toLowerCase();
          const folio = String(ord.folio_orden || ord.folio || '').toLowerCase();
          return nombre.includes(terminoLower) || folio.includes(terminoLower);
        });

        if (coincidencia) {
          const folioCoincidente = coincidencia.folio_orden || coincidencia.folio;
          this.ordenService.obtenerOrdenPorFolio(folioCoincidente).subscribe({
            next: (resp: any) => this.procesarOrdenSeleccionada(resp?.datos || resp),
            error: () => this.procesarOrdenSeleccionada(coincidencia)
          });
        } else {
          window.alert('No se encontró ninguna orden por folio o nombre de paciente.');
          this.limpiarPantalla();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Error en búsqueda secundaria:', err);
        window.alert('No se encontró la orden o hubo un problema de conexión.');
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
      const folioOrdenPago = this.ordenSeleccionada.folio_orden || this.ordenSeleccionada.folio || this.folioBusqueda.value;
      const montoAbono = Number(pagoConfirmado.montoAbonado);
      const nuevoSaldo = Math.max(0, saldoCalculado - montoAbono);

      const esPagoTotal = nuevoSaldo <= 0;
      const clienteNombre = this.ordenSeleccionada.paciente || this.ordenSeleccionada.paciente_nombre || 'Venta General';
      const conceptoMovimiento = esPagoTotal
        ? `Pago Total de Orden - Cliente: ${clienteNombre}`
        : `Abono/Anticipo a Orden - Cliente: ${clienteNombre}`;

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
          this.ofrecerOpcionesComprobante(folioOrdenPago, this.ordenSeleccionada);
          this.limpiarPantalla();
          this.cargarUltimasOrdenes();
        },
        error: (err: any) => {
          console.error('❌ Error al registrar dinero en caja:', err);
          window.alert(err.error?.mensaje || 'Error al procesar el pago en el servidor.');
        }
      });
    }
  }

  async ofrecerOpcionesComprobante(folio: string, orden: any) {
    const celular = orden?.celular || orden?.telefono;
    const email = orden?.email;
    const tieneContactos = Boolean((celular && celular.trim()) || (email && email.trim()));

    const alertOptions = await this.alertCtrl.create({
      header: '¡Pago Registrado con Éxito!',
      subHeader: `Folio: ${folio}`,
      message: tieneContactos
        ? 'Elige cómo deseas enviar o entregar el comprobante al cliente:'
        : '⚠️ Aviso: El cliente no tiene ningún medio de contacto (teléfono celular o correo) registrado.',
      buttons: [
        {
          text: '📱 Enviar por WhatsApp',
          handler: () => {
            if (!celular || !celular.trim()) {
              this.alertCtrl.create({
                header: '⚠️ Sin teléfono registrado',
                message: 'El cliente no tiene registrado ningún número de teléfono celular para WhatsApp.',
                buttons: ['Entendido']
              }).then(a => a.present());
              return false;
            }
            this.enviarWhatsAppTicket(folio, orden);
            return true;
          }
        },
        {
          text: '🖨️ Descargar / Imprimir PDF',
          handler: () => {
            this.imprimirTicket(folio);
            return true;
          }
        },
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await alertOptions.present();
  }

  enviarWhatsAppTicket(folio: string, orden: any) {
    const rawTel = orden?.celular || orden?.telefono;
    if (!rawTel) {
      window.alert('⚠️ El cliente no tiene registrado ningún medio de contacto telefónico.');
      return;
    }

    const numLimpio = String(rawTel).replace(/\D/g, '');
    if (!numLimpio) {
      window.alert('⚠️ El número de teléfono registrado no es válido.');
      return;
    }

    const numFinal = numLimpio.length === 10 ? `52${numLimpio}` : numLimpio;
    const nombreCliente = orden?.paciente || orden?.paciente_nombre || 'Cliente';
    const total = Number(orden?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });
    const saldo = Number(orden?.saldo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 });

    const mensaje = `¡Hola ${nombreCliente}! 👓\n\n` +
      `Gracias por tu pago en *Óptica HL*.\n` +
      `📄 *Comprobante / Orden:* ${folio}\n` +
      `💰 *Total:* $${total}\n` +
      `💳 *Saldo Restante:* $${saldo}\n\n` +
      `¡Quedamos a tus órdenes!`;

    const url = `https://api.whatsapp.com/send?phone=${numFinal}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  /**
   * Abre el Modal de Cobro Rápido / Mostrador
   */
  async cobroRapido() {
    const modal = await this.modalCtrl.create({
      component: ModalCobroRapidoComponent
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data) {
      const movimiento = {
        id_sucursal: 'HL01',
        id_operador: 1,
        folio_orden: null,
        tipo_movimiento: 'INGRESO',
        metodo_pago: data.metodoPago,
        monto: data.monto,
        concepto: `COBRO RÁPIDO: ${data.concepto}`
      };

      this.cajaService.registrarMovimiento(movimiento).subscribe({
        next: () => {
          let mensajeExito = '¡Venta rápida registrada con éxito!';
          if (data.metodoPago === 'EFECTIVO' && data.cambio > 0) {
            mensajeExito += `\n\n💰 CAMBIO A ENTREGAR: $${data.cambio.toFixed(2)}`;
          }
          window.alert(mensajeExito);

          // 🖨️ Descargar e Imprimir Ticket PDF
          this.cajaService.descargarTicketVentaExpresPDF(data.concepto, data.monto, data.metodoPago).subscribe({
            next: (blob: Blob) => {
              const blobUrl = URL.createObjectURL(blob);
              window.open(blobUrl, '_blank');
            },
            error: (err: any) => console.error('Error al generar PDF de Venta Exprés:', err)
          });

          this.cargarUltimasOrdenes();
        },
        error: (err: any) => {
          console.error('❌ Error en cobro rápido:', err);
          const msjError = err.error?.mensaje || err.error?.message || 'No se pudo registrar la venta exprés.';
          window.alert(msjError);
        }
      });
    }
  }

  limpiarPantalla() {
    this.folioBusqueda.setValue('');
    this.ordenSeleccionada = null;
    this.esLiquidada = false;
    this.cdr.detectChanges();
  }

  imprimirTicket(folioParam?: string) {
    const folio = folioParam || this.ordenSeleccionada?.folio_orden || this.ordenSeleccionada?.folio;

    if (!folio) {
      window.alert('No hay un folio seleccionado para generar el ticket.');
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
        window.alert('Error al descargar el ticket PDF. Verifique que cuenta con permisos.');
      }
    });
  }

  async logout() {
    await this.authService.logout();
  }
}