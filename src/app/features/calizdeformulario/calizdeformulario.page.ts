import { Component, ChangeDetectionStrategy } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent 
} from '@ionic/angular/standalone';
import { ClienteFormComponent } from '../../shared/components/cliente-form/cliente-form.component';

@Component({
  selector: 'app-calizdeformulario',
  templateUrl: './calizdeformulario.page.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    ClienteFormComponent
  ]
})
export class CalizdeformularioPage {
  constructor() {}

  handleClienteGuardado(event: any) {
    console.log('¡Evento recibido del formulario!', event);
    alert('Cliente guardado con éxito. Revisa la base de datos.');
  }
}