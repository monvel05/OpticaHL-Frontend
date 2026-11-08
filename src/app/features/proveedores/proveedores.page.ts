import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow,
  IonCol, IonSelect, IonSelectOption, IonInput, IonButton,
  IonCard, ModalController, IonItem, IonLabel, IonButtons, IonIcon,
  IonMenuButton, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { printOutline, barcodeOutline, cartOutline, createOutline, addOutline, pricetagOutline } from 'ionicons/icons';
import { ProveedoresService, Proveedor } from '../../core/services/proveedores.service';
import { ProveedorModalComponent } from '../../shared/components/proveedor-modal/proveedor-modal.component';
import { ModalMarcasComponent } from '../../shared/components/modal-marcas/modal-marcas.component';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption,
    IonInput, IonButton, IonCard, IonItem, IonLabel, IonButtons,
    IonIcon, IonMenuButton
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
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    addIcons({ printOutline, barcodeOutline, cartOutline, createOutline, addOutline, pricetagOutline });
  }

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

  async abrirModalMarcas() {
    const modal = await this.modalCtrl.create({
      component: ModalMarcasComponent,
    });
    await modal.present();
    await modal.onWillDismiss();
  }

  async abrirModalNuevo() {
    const modal = await this.modalCtrl.create({
      component: ProveedorModalComponent,
      cssClass: 'modal-proveedor-size'
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

  // 🖨️ Módulo de Impresión / Reimpresión de Etiquetas Zebra
  async abrirModalReimpresion() {
    const alert = await this.alertCtrl.create({
      header: 'Imprimir / Reimprimir Etiquetas',
      subHeader: 'Etiqueta de código de barras para óptica',
      message: 'Ingresa el código o ID del producto para generar o reimprimir su etiqueta Zebra.',
      inputs: [
        {
          name: 'codigo',
          type: 'text',
          placeholder: 'Ej. ARM-001 o ID de artículo'
        },
        {
          name: 'cantidad',
          type: 'number',
          placeholder: 'Cantidad de copias',
          value: 1,
          min: 1
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: '🖨️ Imprimir',
          handler: (data) => {
            if (!data.codigo || !data.codigo.trim()) {
              this.mostrarToast('Ingresa un código válido.', 'warning');
              return false;
            }

            const cant = parseInt(data.cantidad, 10) || 1;
            this.provService.reimprimirEtiqueta(data.codigo.trim(), cant).subscribe({
              next: (res) => {
                this.mostrarToast(res.message || `${cant} etiqueta(s) enviada(s) a la impresora.`, 'success');
              },
              error: (err) => {
                console.error('Error al imprimir:', err);
                const msg = err.error?.message || 'No se encontró el artículo o falló el servicio de impresión.';
                this.mostrarToast(msg, 'danger');
              }
            });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private async mostrarToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color, position: 'bottom' });
    await toast.present();
  }
}
