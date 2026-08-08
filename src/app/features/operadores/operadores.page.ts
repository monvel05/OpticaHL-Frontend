import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, 
  IonItem, IonLabel, IonBadge, IonButton, IonIcon, 
  IonSkeletonText, IonButtons, ModalController, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, personCircle, logOutOutline } from 'ionicons/icons';
import { OperadoresService, Operador } from '../../core/services/operadores.service';
import { ModalOperadorComponent } from '../../shared/components/modal-operador/modal-operador.component';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-operadores',
  templateUrl: './operadores.page.html',
  styleUrls: ['./operadores.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonList, IonItem, IonLabel, IonBadge, IonButton, IonIcon, 
    IonSkeletonText, IonButtons
  ]
})
export class OperadoresPage implements OnInit {
  // Inyecciones
  private operadoresService = inject(OperadoresService);
  private authService = inject(AuthService); // 👈 AQUÍ ESTABA LO QUE FALTABA
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  // Estados reactivos (Signals)
  cargando = signal<boolean>(true);
  operadores = signal<Operador[]>([]);

  constructor() {
    addIcons({ addCircleOutline, logOutOutline, personCircle });
  }

  ngOnInit() {
    this.cargarOperadores();
  }

  cargarOperadores() {
    this.cargando.set(true);
    
    // Llamada real a la API unificada
    this.operadoresService.obtenerOperadores().subscribe({
      next: (data) => {
        this.operadores.set(data);
        this.cargando.set(false);
      },
      error: async (err) => {
        this.cargando.set(false);
        const toast = await this.toastCtrl.create({
          message: 'Error al cargar los operadores.',
          duration: 3000, 
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  async abrirModalNuevoOperador() {
    const modal = await this.modalCtrl.create({ 
      component: ModalOperadorComponent 
    });
    
    await modal.present();
    
    // Esperamos a que el modal se cierre. Si devuelve 'data', recargamos la lista.
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.cargarOperadores();
    }
  }

  async editarOperador(operador: Operador) {
    const modal = await this.modalCtrl.create({ 
      component: ModalOperadorComponent, 
      componentProps: { operadorActual: operador } // Pasamos los datos del operador al modal
    });
    
    await modal.present();
    
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.cargarOperadores();
    }
  }

  async logout() {
    await this.authService.logout();
  }
}