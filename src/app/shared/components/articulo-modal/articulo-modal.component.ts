import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonItem, IonLabel, IonInput, IonTextarea, IonSelect, 
  IonSelectOption, IonGrid, IonRow, IonCol, ModalController, ToastController 
} from '@ionic/angular/standalone';

export interface Articulo {
  codigo: string;
  marca: string;
  grupo: string;
  modelo: string;
  varillas: string;
  puente: string;
  frente: string;
  flex: 'SI' | 'NO';
  color: string;
  forma: string;
  descripcion: string;
  costo: number;
  precio_venta: number;
  cantidad?: number;
}

@Component({
  selector: 'app-articulo-modal',
  templateUrl: './articulo-modal.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonButton, IonItem, IonLabel, IonInput, IonTextarea, 
    IonSelect, IonSelectOption, IonGrid, IonRow, IonCol
  ]
})
export class ArticuloModalComponent implements OnInit {
  @Input() articuloEditar: Articulo | null = null;

  articulo: Articulo = {
    codigo: '',
    marca: '',
    grupo: '',
    modelo: '',
    varillas: '',
    puente: '',
    frente: '',
    flex: 'NO',
    color: '',
    forma: '',
    descripcion: '',
    costo: 0,
    precio_venta: 0,
    cantidad: 1
  };

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    if (this.articuloEditar) {
      this.articulo = { ...this.articuloEditar };
    }
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  guardar() {
    if (!this.articulo.codigo.trim() || !this.articulo.descripcion.trim()) {
      this.mostrarToast('El código y la descripción son requeridos', 'warning');
      return;
    }

    this.modalCtrl.dismiss(this.articulo);
  }

  async mostrarToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color });
    toast.present();
  }
}