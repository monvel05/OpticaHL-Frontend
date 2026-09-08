import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ModalController, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonItem, IonLabel, IonInput, IonIcon, IonSegment, IonSegmentButton, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, cardOutline, checkmarkCircleOutline, closeOutline, searchOutline, flashOutline } from 'ionicons/icons';
import { CajaService } from 'src/app/core/services/caja.service';

@Component({
  selector: 'app-modalcobrorapido',
  templateUrl: './modalcobrorapido.component.html', // 👈 Corregido el nombre de la plantilla
  styleUrls: ['./modalcobrorapido.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonLabel,
    IonInput,
    IonIcon,
    IonSegment,
    IonSegmentButton,
  ]
})
export class ModalCobroRapidoComponent {
  private modalCtrl = inject(ModalController);
  private cajaService = inject(CajaService);

  concepto: string = '';
  precio: number | null = null;
  metodoPago: string = 'EFECTIVO';
  efectivoRecibido: number | null = null;
  cambio: number = 0;

  constructor() {
    addIcons({ cashOutline, cardOutline, checkmarkCircleOutline, closeOutline, searchOutline, flashOutline });
  }

  get cambioAbsoluto(): number {
    return Math.abs(this.cambio);
  }

  get esValido(): boolean {
    if (!this.concepto || !this.concepto.trim() || !this.precio || this.precio <= 0) return false;
    if (this.metodoPago === 'EFECTIVO') {
      return (this.efectivoRecibido || 0) >= this.precio;
    }
    return true;
  }

  calcularCambio() {
    const p = this.precio || 0;
    if (this.metodoPago === 'TARJETA') {
      this.efectivoRecibido = p;
      this.cambio = 0;
      return;
    }
    const recibido = this.efectivoRecibido || 0;
    this.cambio = recibido - p;
  }

  buscarProducto() {
    if (!this.concepto || !this.concepto.trim()) return;

    this.cajaService.buscarProductosInventario(this.concepto.trim()).subscribe({
      next: (productos: any[]) => {
        if (productos && productos.length > 0) {
          const prod = productos[0];
          this.concepto = prod.nombre || prod.descripcion;
          this.precio = Number(prod.precio);
          this.calcularCambio();
        } else {
          window.alert('No se encontró el producto en inventario.');
        }
      },
      error: () => window.alert('Error al consultar inventario.')
    });
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirmarCobro() {
    this.modalCtrl.dismiss({
      concepto: this.concepto.toUpperCase().trim(),
      monto: Number(this.precio),
      metodoPago: this.metodoPago,
      efectivoRecibido: this.metodoPago === 'EFECTIVO' ? Number(this.efectivoRecibido) : Number(this.precio),
      cambio: this.cambio
    }, 'confirm');
  }
}