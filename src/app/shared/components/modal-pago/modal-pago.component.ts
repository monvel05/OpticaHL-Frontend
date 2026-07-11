import { Component, Input, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-pago',
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss'],
  standalone: true, // Asegúrate de incluir standalone si usas Angular moderno
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ModalPagoComponent {

  private modalCtrl = inject(ModalController);

  // Inputs recibidos al abrir el modal desde caja.page.ts
  @Input() set saldo(val: number) { 
    this.saldoPendiente.set(val); 
    // Opcional: inicializamos el monto recibido con el total para ahorrarle clics al cajero si paga exacto
    this.montoRecibido.set(val); 
  }

  // Manejo de estado reactivo (Signals)
  saldoPendiente = signal<number>(0);
  montoRecibido = signal<number>(0);
  metodoPago = signal<string>('Efectivo');

  // Cálculos automáticos con Computed Signals
  cambio = computed(() => {
    if (this.metodoPago() !== 'Efectivo') return 0;
    return Math.max(0, this.montoRecibido() - this.saldoPendiente());
  });

  // BLINDAJE FINANCIERO: Valida de manera estricta las condiciones de cobro
  esValido = computed(() => {
    const monto = this.montoRecibido();
    const saldo = this.saldoPendiente();
    const metodo = this.metodoPago();

    if (!metodo || monto <= 0) return false;

    if (metodo === 'Efectivo') {
      // En efectivo puede recibir más dinero (y dar cambio) o el monto exacto
      return monto >= saldo;
    } else {
      // En tarjeta o transferencia el cobro en la terminal bancaria DEBE ser exacto al total
      return monto === saldo;
    }
  });

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  procesarPago() {
    const pagoData = {
      // Retornamos el saldo que se liquida o el monto abonado real
      montoAbonado: Math.min(this.montoRecibido(), this.saldoPendiente()),
      metodo: this.metodoPago()
    };
    
    // Devolvemos la información del pago confirmada al componente padre (CajaPage)
    this.modalCtrl.dismiss(pagoData, 'confirm');
  }
}