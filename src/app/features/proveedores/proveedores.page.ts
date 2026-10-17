import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow,
  IonCol, IonSelect, IonSelectOption, IonInput, IonButton,
  IonCard, ModalController, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { ProveedoresService, Proveedor } from '../../core/services/proveedores.service';

import { ProveedorModalComponent } from '../../shared/components/proveedor-modal/proveedor-modal.component';
@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.page.html',
  standalone: true,
  imports: [IonLabel, IonItem,
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption,
    IonInput, IonButton, IonCard
  ]
})
export class ProveedoresPage implements OnInit {
  buscarPor: string = 'NOMBRE';
  terminoBusqueda: string = '';
  proveedores: Proveedor[] = [];
  proveedorSeleccionado: Proveedor | null = null;

  constructor(
    private provService: ProveedoresService,
    private modalCtrl: ModalController,
    private router: Router
  ) { }

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    this.provService.getProveedores(this.terminoBusqueda, this.buscarPor).subscribe({
      next: (data) => {
        this.proveedores = data;
        this.proveedorSeleccionado = null;
      }
    });
  }

  seleccionar(p: Proveedor) {
    this.proveedorSeleccionado = p;
  }

  async abrirModalNuevo() {
    const modal = await this.modalCtrl.create({
      component: ProveedorModalComponent,
      cssClass: 'modal-proveedor-size' // Clase para ajustar tamaño
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) this.buscar();
  }

  async abrirModalEditar() {
    if (!this.proveedorSeleccionado) return;
    const modal = await this.modalCtrl.create({
      component: ProveedorModalComponent,
      componentProps: { proveedorEditar: this.proveedorSeleccionado }
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) this.buscar();
  }

  irACompras() {
    if (this.proveedorSeleccionado) {
      this.router.navigate(['/compras'], {
        queryParams: {
          id: this.proveedorSeleccionado.id_proveedor,
          nombre: this.proveedorSeleccionado.razon_social
        }
      });
    }
  }
}