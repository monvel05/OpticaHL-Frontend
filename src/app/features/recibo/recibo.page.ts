import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { OrdenService } from '../../core/services/orden.service';

@Component({
  selector: 'app-recibo',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './recibo.page.html',
  styleUrls: ['./recibo.page.scss']
})
export class ReciboPage implements OnInit {

  private route = inject(ActivatedRoute);
  private ordenService = inject(OrdenService);
  private toastCtrl = inject(ToastController);

  recibo: any;
  loading = false;

  ngOnInit() {
    const folio = this.route.snapshot.paramMap.get('folio');
    if (folio) this.cargar(folio);
  }

  async cargar(folio: string) {
    this.loading = true;

    this.ordenService.getRecibo(folio).subscribe({
      next: (res) => {
        this.recibo = res;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toastCtrl.create({
          message: 'Error cargando recibo',
          duration: 2000,
          color: 'danger'
        });
        t.present();
      }
    });
  }
}
