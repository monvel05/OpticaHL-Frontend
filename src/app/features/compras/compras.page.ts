import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, 
  IonCol, IonRadioGroup, IonRadio, IonInput, IonButton, 
  IonCard, ModalController, ToastController, AlertController, 
  IonItem, IonLabel, IonButtons, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { printOutline, addOutline, trashOutline } from 'ionicons/icons';
import { ProveedoresService } from '../../core/services/proveedores.service';
import { ArticuloModalComponent, Articulo } from '../../shared/components/articulo-modal/articulo-modal.component';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.page.html',
  styleUrls: ['./compras.page.scss'],
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonGrid, IonRow, IonCol, IonRadioGroup, IonRadio, 
    IonInput, IonButton, IonCard, IonItem, IonLabel, IonButtons, IonIcon
  ]
})
export class ComprasPage implements OnInit {
  idProveedor: number | null = null;
  nombreProveedor: string = '';

  compra = {
    clave: '',
    num_factura: '',
    fecha_factura: new Date().toISOString().substring(0, 10),
    tipo_compra: 'ARMAZON',
    subtotal: 0,
    descuento: 0,
    otros_cargos: 0,
    iva: 0,
    total: 0
  };

  items: Articulo[] = [];
  itemSeleccionadoIndex: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private provService: ProveedoresService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private cdRef: ChangeDetectorRef
  ) {
    addIcons({ printOutline, addOutline, trashOutline });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.idProveedor = Number(params['id']);
        this.compra.clave = String(this.idProveedor);
        this.nombreProveedor = params['nombre'] || '';
      }
    });
  }

  async abrirModalAgregarItem() {
    const modal = await this.modalCtrl.create({
      component: ArticuloModalComponent
    });
    
    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (data) {
      // Reasignamos el array completo para forzar la reactividad en la vista
      this.items = [...this.items, data];
      this.calcularTotales();
      this.cdRef.detectChanges();
    }
  }

  quitarItem() {
    if (this.itemSeleccionadoIndex !== null) {
      this.items.splice(this.itemSeleccionadoIndex, 1);
      this.items = [...this.items];
      this.itemSeleccionadoIndex = null;
      this.calcularTotales();
      this.cdRef.detectChanges();
    }
  }

  seleccionarItem(index: number) {
    this.itemSeleccionadoIndex = index;
  }

  calcularTotales() {
    const subtotalCalculado = this.items.reduce(
      (acc, item) => acc + (item.costo * (item.cantidad || 1)), 0
    );

    this.compra.subtotal = subtotalCalculado;
    const subtotalConDescuento = this.compra.subtotal - (this.compra.descuento || 0) + (this.compra.otros_cargos || 0);
    this.compra.iva = subtotalConDescuento * 0.16;
    this.compra.total = subtotalConDescuento + this.compra.iva;
  }

  grabarCompra() {
    if (this.items.length === 0) {
      this.mostrarToast('Debes agregar al menos un artículo', 'warning');
      return;
    }

    const payloadCompra = {
      compra: {
        id_proveedor: this.idProveedor,
        num_factura: this.compra.num_factura,
        fecha_factura: this.compra.fecha_factura,
        tipo_compra: this.compra.tipo_compra,
        subtotal: this.compra.subtotal,
        descuento: this.compra.descuento,
        otros_cargos: this.compra.otros_cargos,
        iva: this.compra.iva,
        total: this.compra.total
      },
      items: this.items
    };

    this.provService.guardarCompra(payloadCompra.compra, payloadCompra.items).subscribe({
      next: async () => {
        await this.mostrarToast('Compra y stock registrados con éxito', 'success');
        this.confirmarImpresionZebra();
      },
      error: (err) => {
        console.error('Error al guardar compra:', err);
        this.mostrarToast('Error al grabar la compra', 'danger');
      }
    });
  }

  async confirmarImpresionZebra() {
    const alert = await this.alertCtrl.create({
      header: 'Impresión de Etiquetas',
      message: '¿Deseas imprimir las etiquetas Zebra para los artículos ingresados?',
      buttons: [
        {
          text: 'No, finalizar',
          role: 'cancel',
          handler: () => {
            this.router.navigate(['/proveedores']);
          }
        },
        {
          text: '🖨️ Imprimir Etiquetas',
          handler: () => {
            this.provService.imprimirEtiquetasZebra(this.items).subscribe({
              next: () => {
                this.mostrarToast('Etiquetas enviadas a la impresora Zebra', 'success');
                this.router.navigate(['/proveedores']);
              },
              error: (err) => {
                console.error('Error al imprimir etiquetas:', err);
                this.mostrarToast('No se pudo conectar con la impresora Zebra', 'warning');
                this.router.navigate(['/proveedores']);
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async abrirModalReimpresion() {
    const alert = await this.alertCtrl.create({
      header: 'Reimprimir Etiqueta',
      subHeader: 'Ingresa el código o ID del artículo a reimprimir',
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
            if (!data.codigo) {
              this.mostrarToast('Ingresa un código válido', 'warning');
              return false;
            }

            const cant = parseInt(data.cantidad) || 1;
            this.provService.reimprimirEtiqueta(data.codigo, cant).subscribe({
              next: (res) => {
                this.mostrarToast(res.message || 'Etiqueta enviada a la impresora', 'success');
              },
              error: (err) => {
                console.error('Error al reimprimir:', err);
                const msg = err.error?.message || 'No se encontró el artículo o falló la impresora';
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

  cancelar() {
    this.router.navigate(['/proveedores']);
  }

  async mostrarToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color });
    toast.present();
  }
}