import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonLabel,
  IonInput,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonItem
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  cardOutline,
  checkmarkCircleOutline,
  closeOutline,
  searchOutline,
  swapHorizontalOutline,
  addCircleOutline,
  removeCircleOutline,
  trashOutline
} from 'ionicons/icons';
import { CajaService } from 'src/app/core/services/caja.service';

export interface ItemCobroRapido {
  id_articulo: number | string;
  concepto: string;
  precioUnitario: number;
  cantidad: number;
  stockMaximo: number;
}

@Component({
  selector: 'app-modalcobrorapido',
  templateUrl: './modalcobrorapido.component.html',
  styleUrls: ['./modalcobrorapido.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonLabel,
    IonInput,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonList,
    IonItem
  ]
})
export class ModalCobroRapidoComponent {
  private modalCtrl = inject(ModalController);
  private cajaService = inject(CajaService);

  busquedaTexto: string = '';
  productosFiltrados: any[] = [];
  mostrarSugerencias: boolean = false;

  itemsCobro: ItemCobroRapido[] = [];
  metodoPago: string = 'EFECTIVO';
  efectivoRecibido: number | null = null;
  cambio: number = 0;

  constructor() {
    addIcons({
      cashOutline, cardOutline, checkmarkCircleOutline, closeOutline,
      searchOutline, swapHorizontalOutline, addCircleOutline, removeCircleOutline, trashOutline
    });
  }

  get totalCobrar(): number {
    return this.itemsCobro.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  }

  get cambioAbsoluto(): number {
    return Math.abs(this.cambio);
  }

  get esValido(): boolean {
    if (this.itemsCobro.length === 0 || this.totalCobrar <= 0) return false;
    if (this.metodoPago === 'EFECTIVO') {
      return (this.efectivoRecibido || 0) >= this.totalCobrar;
    }
    return true;
  }

  // 🔍 Función auxiliar para extraer dinámicamente el ID del producto
  private obtenerIdDinamico(p: any): number | string | undefined {
    if (!p) return undefined;

    // 1. Verificar nombres habituales de propiedad ID
    const idDirecto = p.id_articulo ?? p.id ?? p.id_producto ?? p.idArticulo ?? p.id_item ?? p.id_inventario ?? p.clave ?? p.codigo ?? p.codigo_barras;
    if (idDirecto !== undefined && idDirecto !== null) return idDirecto;

    // 2. Si no coincide con ninguna conocida, busca cualquier propiedad que tenga 'id', 'clave' o 'codigo'
    const llaves = Object.keys(p);
    const llaveId = llaves.find(k => 
      k.toLowerCase().includes('id') || 
      k.toLowerCase().includes('clave') || 
      k.toLowerCase().includes('codigo')
    );

    return llaveId ? p[llaveId] : undefined;
  }

  onInputBusqueda(event: any) {
    const val = (event?.detail?.value || event?.target?.value || '').toString().trim();
    this.busquedaTexto = val;

    if (!val) {
      this.mostrarSugerencias = false;
      this.productosFiltrados = [];
      return;
    }

    this.cajaService.buscarProductosInventario(val).subscribe({
      next: (prods: any[]) => {
        console.log('🔍 Objeto crudo del Backend:', prods);

        if (prods && prods.length > 0) {
          this.productosFiltrados = prods.map(p => {
            const idEncontrado = this.obtenerIdDinamico(p);

            return {
              id_articulo: idEncontrado,
              nombre: p.nombre || p.descripcion || p.articulo || 'Sin Nombre',
              precio: Number(p.precio || p.precio_venta || p.precio_unitario || 0),
              stock: Number(p.stock_actual ?? p.stock ?? p.existencias ?? p.cantidad ?? 0)
            };
          });
          this.mostrarSugerencias = true;
        } else {
          this.productosFiltrados = [];
          this.mostrarSugerencias = false;
        }
      },
      error: (err) => {
        console.error('Error al buscar productos:', err);
        this.productosFiltrados = [];
        this.mostrarSugerencias = false;
      }
    });
  }

  seleccionarYAgregar(prod: { id_articulo: number | string; nombre: string; precio: number; stock: number }) {
    if (!prod.id_articulo) {
      console.error('Objeto sin ID válido:', prod);
      window.alert(`Error: No se encontró un ID válido para "${prod.nombre}". Revisa la consola (F12).`);
      return;
    }

    if (prod.stock <= 0) {
      window.alert(`El producto "${prod.nombre}" no tiene existencias en stock.`);
      return;
    }

    const existente = this.itemsCobro.find(item => item.id_articulo === prod.id_articulo);

    if (existente) {
      if (existente.cantidad < prod.stock) {
        existente.cantidad += 1;
      } else {
        window.alert(`No puedes agregar más de ${prod.stock} unidades (Stock disponible).`);
      }
    } else {
      this.itemsCobro.push({
        id_articulo: prod.id_articulo,
        concepto: prod.nombre,
        precioUnitario: prod.precio,
        cantidad: 1,
        stockMaximo: prod.stock
      });
    }

    this.busquedaTexto = '';
    this.mostrarSugerencias = false;
    this.productosFiltrados = [];
    this.calcularCambio();
  }

  buscarYSeleccionarPrimero() {
    if (!this.busquedaTexto.trim()) return;

    if (this.productosFiltrados.length > 0) {
      this.seleccionarYAgregar(this.productosFiltrados[0]);
    } else {
      this.cajaService.buscarProductosInventario(this.busquedaTexto.trim()).subscribe({
        next: (prods: any[]) => {
          if (prods && prods.length > 0) {
            const p = prods[0];
            const idEncontrado = this.obtenerIdDinamico(p);

            this.seleccionarYAgregar({
              id_articulo: idEncontrado!,
              nombre: p.nombre || p.descripcion || p.articulo || 'Sin Nombre',
              precio: Number(p.precio || p.precio_venta || p.precio_unitario || 0),
              stock: Number(p.stock_actual ?? p.stock ?? p.existencias ?? p.cantidad ?? 0)
            });
          } else {
            window.alert('No se encontró el producto en inventario.');
          }
        }
      });
    }
  }

  incrementarCantidad(item: ItemCobroRapido) {
    if (item.cantidad < item.stockMaximo) {
      item.cantidad += 1;
      this.calcularCambio();
    } else {
      window.alert(`Alcanzaste el límite de stock disponible (${item.stockMaximo} unidades).`);
    }
  }

  decrementarCantidad(item: ItemCobroRapido) {
    if (item.cantidad > 1) {
      item.cantidad -= 1;
      this.calcularCambio();
    }
  }

  onCantidadInput(event: any, item: ItemCobroRapido) {
    const rawVal = event?.detail?.value || event?.target?.value;
    let num = parseInt(rawVal, 10);
    if (isNaN(num) || num < 1) num = 1;

    if (num > item.stockMaximo) {
      window.alert(`Solo hay ${item.stockMaximo} unidades disponibles.`);
      num = item.stockMaximo;
    }

    item.cantidad = num;
    this.calcularCambio();
  }

  eliminarItem(index: number) {
    this.itemsCobro.splice(index, 1);
    this.calcularCambio();
  }

  onMetodoPagoChange(event: any) {
    this.metodoPago = event?.detail?.value || 'EFECTIVO';
    this.calcularCambio();
  }

  onEfectivoInput(event: any) {
    const rawVal = event?.detail?.value || event?.target?.value;
    const val = parseFloat(rawVal);
    this.efectivoRecibido = isNaN(val) ? null : val;
    this.calcularCambio();
  }

  calcularCambio() {
    const total = this.totalCobrar;
    if (this.metodoPago !== 'EFECTIVO') {
      this.efectivoRecibido = total;
      this.cambio = 0;
      return;
    }
    const recibido = this.efectivoRecibido || 0;
    this.cambio = recibido - total;
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirmarCobro() {
    const conceptosResumen = this.itemsCobro
      .map(i => `${i.cantidad}x ${i.concepto}`)
      .join(', ');

    const itemsLimpios = this.itemsCobro.map(item => ({
      id_articulo: item.id_articulo,
      cantidad: item.cantidad
    }));

    this.modalCtrl.dismiss({
      concepto: conceptosResumen,
      items: itemsLimpios,
      monto: this.totalCobrar,
      metodo_pago: this.metodoPago,
      efectivoRecibido: this.metodoPago === 'EFECTIVO' ? Number(this.efectivoRecibido) : this.totalCobrar,
      cambio: this.cambio
    }, 'confirm');
  }
}