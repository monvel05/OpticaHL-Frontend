import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, 
  IonCol, IonRadioGroup, IonRadio, IonInput, IonButton, 
  IonCard, ModalController, ToastController, IonItem, IonLabel 
} from '@ionic/angular/standalone';
import { ProveedoresService } from '../../core/services/proveedores.service';
import { ArticuloModalComponent, Articulo } from '../../shared/components/articulo-modal/articulo-modal.component';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.page.html',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonGrid, IonRow, IonCol, IonRadioGroup, IonRadio, 
    IonInput, IonButton, IonCard, IonItem, IonLabel
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
    private toastCtrl: ToastController
  ) {}

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
      this.items.push(data);
      this.calcularTotales();
    }
  }

  quitarItem() {
    if (this.itemSeleccionadoIndex !== null) {
      this.items.splice(this.itemSeleccionadoIndex, 1);
      this.itemSeleccionadoIndex = null;
      this.calcularTotales();
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
  if (!this.idProveedor) {
    this.mostrarToast('No hay un proveedor seleccionado', 'danger');
    return;
  }

  if (this.items.length === 0) {
    this.mostrarToast('Debes agregar al menos un artículo', 'warning');
    return;
  }

  const payloadCompra = {
    compra: {
      id_proveedor: this.idProveedor,
      folio_compra: this.compra.clave,
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
    next: async (res) => {
      await this.mostrarToast('Compra grabada con éxito y stock actualizado', 'success');
      // Redirecciona al usuario de vuelta a la lista de proveedores o inventario
      this.router.navigate(['/proveedores']);
    },
    error: (err) => {
      console.error('Error al guardar compra:', err);
      this.mostrarToast('Error al grabar la compra en el servidor', 'danger');
    }
  });
}

  cancelar() {
    this.router.navigate(['/proveedores']);
  }

  async mostrarToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color });
    toast.present();
  }
}