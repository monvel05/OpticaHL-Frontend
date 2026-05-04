import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { OrdenService } from '../../core/services/orden.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss']
})
export class ReportesPage implements OnInit {

  private ordenService = inject(OrdenService);

  fecha: string = new Date().toISOString().split('T')[0];
  ingresos: any;

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.ordenService.getIngresos(this.fecha).subscribe(res => {
      this.ingresos = res;
    });
  }
}
