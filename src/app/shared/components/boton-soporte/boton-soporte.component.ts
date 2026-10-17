import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonButton, IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { helpBuoyOutline } from 'ionicons/icons';
import { ModalSoporteComponent } from '../modal-soporte/modal-soporte.component';

@Component({
  selector: 'app-boton-soporte',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  template: `
    <ion-button (click)="abrirModalSoporte()" fill="clear" color="light" class="btn-soporte-navbar" title="Ayuda / Reportar Falla">
      <ion-icon slot="icon-only" name="help-buoy-outline"></ion-icon>
    </ion-button>
  `,
  styles: [`
    .btn-soporte-navbar {
      --color: #ffffff;
      font-size: 1.25rem;
      margin: 0 4px;

      ion-icon {
        font-size: 22px;
        color: #ffffff;
      }
    }
  `]
})
export class BotonSoporteComponent {
  private modalCtrl = inject(ModalController);
  private router = inject(Router);

  constructor() {
    addIcons({ helpBuoyOutline });
  }

  async abrirModalSoporte() {
    const modal = await this.modalCtrl.create({
      component: ModalSoporteComponent,
      componentProps: {
        rutaActual: this.router.url
      }
    });
    await modal.present();
  }
}
