import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
// 1. Aquí lo importas para el archivo
import { ClienteFormComponent } from '../../shared/components/cliente-form/cliente-form.component';

@Component({
  selector: 'app-calizdeformulario',
  templateUrl: './calizdeformulario.page.html',
  standalone: true,
  // 2. ¡AQUÍ ES DONDE TE FALTA! Agrégalo a esta lista
  imports: [
    CommonModule, 
    IonicModule, 
    ClienteFormComponent // <--- Ponlo aquí
  ]
})
export class CalizdeformularioPage {
  constructor() {}

  handleClienteGuardado(event: any) {
    console.log('¡Evento recibido del formulario!', event);
    alert('Cliente guardado con éxito. Revisa la base de datos.');
  }
}