import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, RefresherCustomEvent } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { OrdenService } from '../../core/services/orden.service';

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './cuentas.page.html',
  styleUrls: ['./cuentas.page.scss']
})
export class CuentasPage implements OnInit {

  private ordenService = inject(OrdenService);
  private toastCtrl = inject(ToastController);

  cuentas: any[] = [];
  loading = false;

  ngOnInit() {
    this.cargar();
  }

  async cargar() {
    this.loading = true;
    this.ordenService.getCuentasPorCobrar().subscribe({
      next: (res) => {
        this.cuentas = res;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toastCtrl.create({
          message: 'Error cargando cuentas',
          duration: 2000,
          color: 'danger'
        });
        t.present();
      }
    });
  }

  refrescar(ev: Event) {
    this.ordenService.getCuentasPorCobrar().subscribe({
      next: (res) => {
        this.cuentas = res;
        (ev as RefresherCustomEvent).detail.complete();
      },
      error: () => (ev as RefresherCustomEvent).detail.complete()
    });
  }
}
