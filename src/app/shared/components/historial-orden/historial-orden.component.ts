// src/app/pages/historial-orden/historial-orden.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { OrdenService } from 'src/app/core/services/orden.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-historial-orden',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './historial-orden.component.html',
  styleUrls: ['./historial-orden.component.scss'],
})
export class HistorialOrdenComponent implements OnInit {

  private ordenService = inject(OrdenService);
  public authService = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // Estados Reactivos
  orders = signal<any[]>([]);
  cargando = signal<boolean>(true);

  ngOnInit() {
    this.cargarOrdenes();
  }

  cargarOrdenes() {
    this.cargando.set(true);
    this.ordenService.obtenerOrdenes().subscribe({
      next: (res) => {
        // Tu API responde con { exito: true, datos: [...] }
        if (res.exito) {
          this.orders.set(res.datos);
        }
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.mostrarMensaje('Error al cargar el historial de órdenes', 'danger');
        console.error(err);
      }
    });
  }

  async confirmarCancelacion(orderId: number) {
    const alert = await this.alertCtrl.create({
      header: '¿Cancelar Orden?',
      message: `Estás a punto de cancelar la orden #${orderId}. Esta acción devolverá el inventario y registrará una salida en caja. ¿Deseas continuar?`,
      buttons: [
        { text: 'No, regresar', role: 'cancel', cssClass: 'secondary' },
        { 
          text: 'Sí, Cancelar', 
          cssClass: 'danger',
          handler: () => { this.ejecutarCancelacion(orderId); }
        }
      ]
    });
    await alert.present();
  }

  private ejecutarCancelacion(orderId: number) {
    this.ordenService.cancelarOrden(orderId).subscribe({
      next: async (res) => {
        this.orders.update(orders => 
          orders.map(o => o.id === orderId ? { ...o, estatus: 'Cancelada' } : o)
        );
        this.mostrarMensaje(res.mensaje, 'success');
      },
      error: async (err) => {
        this.mostrarMensaje(err.error.mensaje || 'Error al cancelar la orden', 'danger');
      }
    });
  }

  private async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje, duration: 3000, color: color, position: 'bottom'
    });
    await toast.present();
  }
}