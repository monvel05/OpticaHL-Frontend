import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-corte-caja',
  templateUrl: './cortecaja.page.html',
  styleUrls: ['./cortecaja.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CorteCajaPage {

  constructor(private alertCtrl: AlertController) {}

  async confirmarCierre() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Cierre',
      message: '¿Estás seguro de cerrar la caja? Se enviará el resumen al administrador.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sí, Cerrar', handler: () => console.log('Corte realizado') }
      ]
    });
    await alert.present();
  }

  imprimirResumen() {
    console.log('Generando PDF de corte...');
  }
}