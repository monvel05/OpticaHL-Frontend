import { Component, Input, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, 
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonList, 
  IonItem, IonSelect, IonSelectOption, IonInput, IonIcon, ModalController 
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-modal-pago',
  templateUrl: './modal-pago.component.html',
  styleUrls: ['./modal-pago.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardSubtitle, 
    IonCardTitle, 
    IonList, 
    IonItem, 
    IonSelect, 
    IonSelectOption, 
    IonInput, 
    IonIcon
  ],
})
export class ModalPagoComponent {

  private modalCtrl = inject(ModalController);

  // Inputs desde caja.page.ts
  @Input() set saldo(val: number) { 
    this.saldoPendiente.set(Number(val) || 0); 
  }

  @Input() set total(val: number) { 
    this.totalOrden.set(Number(val) || 0); 
  }

  @Input() set anticipoPrevio(val: number) { 
    const previo = Number(val) || 0;
    this.pagosPrevios.set(previo);
  }

  // Signals de estado
  saldoPendiente = signal<number>(0);
  totalOrden = signal<number>(0);
  pagosPrevios = signal<number>(0);
  
  montoRecibido = signal<number>(0);
  metodoPago = signal<string>('Efectivo');

  // Determina el monto mínimo que debe pagar el cliente
  montoMinimoRequerido = computed(() => {
    // Si la orden NO tiene abonos anteriores, se exige mínimo el 50% del TOTAL general
    if (this.pagosPrevios() <= 0) {
      return this.totalOrden() * 0.5;
    }
    // Si ya dio un anticipo antes, puede abonar cualquier monto mayor a $0 hasta liquidar
    return 1;
  });

  // Calcula si el pago ingresado genera cambio en efectivo
  cambio = computed(() => {
    if (this.metodoPago() !== 'Efectivo') return 0;
    return Math.max(0, this.montoRecibido() - this.saldoPendiente());
  });

  // Calcula el nuevo saldo restante que le quedará a la orden
  nuevoSaldoPendiente = computed(() => {
    const abonoReal = Math.min(this.montoRecibido(), this.saldoPendiente());
    return Math.max(0, this.saldoPendiente() - abonoReal);
  });

  // Validación dinámica de abonos/liquidación
  esValido = computed(() => {
    const monto = Number(this.montoRecibido()) || 0;
    const saldo = this.saldoPendiente();
    const minimo = this.montoMinimoRequerido();
    const metodo = this.metodoPago();

    if (!metodo || monto <= 0) return false;

    // Validación de tope mínimo y tope máximo (no abonar más del saldo pendiente)
    if (monto < minimo) return false;

    if (metodo === 'Efectivo') {
      return true; // En efectivo puede pagar de más y el sistema le da cambio
    } else {
      // En Tarjeta o Transferencia no hay cambio, el monto digitado no puede exceder el saldo pendiente
      return monto <= saldo;
    }
  });

  constructor() {
    addIcons({ cashOutline });
  }

  ngOnInit() {
    // Al abrir el modal sugerimos por defecto el monto del saldo pendiente
    if (this.saldoPendiente() > 0) {
      this.montoRecibido.set(this.saldoPendiente());
    }
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  procesarPago() {
    const montoAbonoFinal = Math.min(this.montoRecibido(), this.saldoPendiente());
    
    const pagoData = {
      montoAbonado: montoAbonoFinal,
      metodo: this.metodoPago()
    };
    
    this.modalCtrl.dismiss(pagoData, 'confirm');
  }
}