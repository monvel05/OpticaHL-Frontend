import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonList, IonItem, IonAvatar, IonLabel, IonButton, IonFab, IonFabButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';

@Component({
  selector: 'app-operadores',
  templateUrl: './operadores.page.html',
  styleUrls: ['./operadores.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonList, IonItem, IonAvatar, IonLabel, IonButton, IonFab, IonFabButton, IonIcon
  ]
})
export class OperadoresPage implements OnInit {

  operadores: any[] = []; 

  constructor() { 
    addIcons({ add });
  }

  ngOnInit() {
  }

  editar(operador: any) {
    console.log('Editar operador', operador);
  }

  eliminar(id: number) {
    console.log('Eliminar operador con ID:', id);
  }

  abrirModalCrear() {
    console.log('Abriendo modal para crear operador...');
  }
}