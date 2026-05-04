import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class CajaPage {
  folioBusqueda = new FormControl('');
  ordenSeleccionada: any = null; // Aquí guardaremos lo que regrese la búsqueda

  constructor() {}

  buscarOrden() {
    const folio = this.folioBusqueda.value;
    console.log('Buscando folio en la óptica:', folio);
    // Aquí irá la llamada a tu servicio después
    // Por ahora simularemos datos:
    this.ordenSeleccionada = {
      cliente: 'Juan Pérez',
      items: [
        { desc: 'Armazón Ray-Ban', precio: 2500 },
        { desc: 'Micas Graduadas Antireflejante', precio: 1200 }
      ],
      total: 3700
    };
  }
}