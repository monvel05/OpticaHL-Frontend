import { Component, Input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-pago',
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ModalPagoComponent {

  private modalCtrl = inject(ModalController);

  // Inputs recibidos al abrir el modal
  @Input() set saldo(val: number) { 
    this.saldoPendiente.set(val); 
  }

  // Manejo de estado reactivo (Signals)
  saldoPendiente = signal<number>(0);
  montoRecibido = signal<number>(0);
  metodoPago = signal<string>('Efectivo');

  // Cálculos automáticos
  cambio = computed(() => Math.max(0, this.montoRecibido() - this.saldoPendiente()));
  esValido = computed(() => this.montoRecibido() > 0 && this.metodoPago() !== '');

  cerrar() {
    this.modalCtrl.dismiss();
  }

  procesarPago() {
    const pagoData = {
      montoAbonado: Math.min(this.montoRecibido(), this.saldoPendiente()),
      metodo: this.metodoPago()
    };
    
    // Devolvemos la información del pago al componente padre que abrió el modal
    this.modalCtrl.dismiss(pagoData, 'confirm');
  }
}

