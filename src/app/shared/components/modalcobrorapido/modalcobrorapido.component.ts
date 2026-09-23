import { Component, inject, OnInit } from '@angular/core';
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
  IonItem,
  IonBadge
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
  trashOutline,
  pricetagOutline
} from 'ionicons/icons';
import { CajaService } from 'src/app/core/services/caja.service';
import { DescuentoService, Promocion } from 'src/app/core/services/descuento.service';

export interface ItemCobroRapido {
  id_articulo: number | string;
  concepto: string;
  precioOriginal: number;
  precioUnitario: number;
  porcentajeDescuento: number;
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
    IonItem,
    IonBadge
  ]
})
export class ModalCobroRapidoComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private cajaService = inject(CajaService);
  private descuentoService = inject(DescuentoService);

  busquedaTexto: string = '';
  productosFiltrados: any[] = [];
  mostrarSugerencias: boolean = false;
  promocionesVigentes: Promocion[] = [];

  itemsCobro: ItemCobroRapido[] = [];
  metodoPago: string = 'EFECTIVO';
  efectivoRecibido: number | null = null;
  cambio: number = 0;

  constructor() {
    addIcons({
      cashOutline, cardOutline, checkmarkCircleOutline, closeOutline,
      searchOutline, swapHorizontalOutline, addCircleOutline, removeCircleOutline, trashOutline, pricetagOutline
    });
  }

  ngOnInit() {
    this.cargarPromocionesVigentes();
  }

  cargarPromocionesVigentes() {
    this.descuentoService.obtenerDescuentosVigentes().subscribe({
      next: (res: any) => {
        this.promocionesVigentes = res?.datos || res || [];
      },
      error: (err: any) => console.warn('Aviso: No se pudieron cargar descuentos vigentes:', err)
    });
  }

  // Calcula si a un producto le aplica alguna promoción activa
  calcularDescuentoProducto(prod: any): { precioFinal: number; porcentaje: number } {
    const precioBase = Number(prod.precio || prod.precio_venta || 0);
    if (!this.promocionesVigentes || this.promocionesVigentes.length === 0) {
      return { precioFinal: precioBase, porcentaje: 0 };
    }

    const idArt = String(prod.id_articulo || prod.id || '');
    const catArt = String(prod.categoria || '').toUpperCase();

    // 1. Descuento específico por producto rezagado (Prioridad 1)
    const promoProducto = this.promocionesVigentes.find(
      p => p.tipo_aplicacion === 'PRODUCTO' && String(p.id_articulo) === idArt
    );
    if (promoProducto) {
      const desc = Number(promoProducto.porcentaje_descuento);
      return {
        precioFinal: Math.max(0, precioBase * (1 - desc / 100)),
        porcentaje: desc
      };
    }

    // 2. Descuento por categoría (Prioridad 2)
    const promoCat = this.promocionesVigentes.find(
      p => p.tipo_aplicacion === 'CATEGORIA' && String(p.categoria).toUpperCase() === catArt
    );
    if (promoCat) {
      const desc = Number(promoCat.porcentaje_descuento);
      return {
        precioFinal: Math.max(0, precioBase * (1 - desc / 100)),
        porcentaje: desc
      };
    }

    // 3. Descuento global tipo Buen Fin (Prioridad 3)
    const promoGlobal = this.promocionesVigentes.find(p => p.tipo_aplicacion === 'TODOS');
    if (promoGlobal) {
      const desc = Number(promoGlobal.porcentaje_descuento);
      return {
        precioFinal: Math.max(0, precioBase * (1 - desc / 100)),
        porcentaje: desc
      };
    }

    return { precioFinal: precioBase, porcentaje: 0 };
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

  private obtenerIdDinamico(p: any): number | string | undefined {
    if (!p) return undefined;
    const idDirecto = p.id_articulo ?? p.id ?? p.id_producto ?? p.idArticulo ?? p.id_item ?? p.id_inventario;
    if (idDirecto !== undefined && idDirecto !== null) return idDirecto;

    const llaves = Object.keys(p);
    const llaveId = llaves.find(k => k.toLowerCase().includes('id') || k.toLowerCase().includes('clave'));
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
        if (prods && prods.length > 0) {
          this.productosFiltrados = prods.map(p => {
            const idEncontrado = this.obtenerIdDinamico(p);
            const precioNormal = Number(p.precio || p.precio_venta || p.precio_unitario || 0);
            const calculo = this.calcularDescuentoProducto({ ...p, id_articulo: idEncontrado, precio: precioNormal });

            return {
              id_articulo: idEncontrado,
              nombre: p.nombre || p.descripcion || p.articulo || 'Sin Nombre',
              precioOriginal: precioNormal,
              precioFinal: calculo.precioFinal,
              porcentajeDescuento: calculo.porcentaje,
              stock: Number(p.stock_actual ?? p.stock ?? p.existencias ?? p.cantidad ?? 0)
            };
          });
          this.mostrarSugerencias = true;
        } else {
          this.productosFiltrados = [];
          this.mostrarSugerencias = false;
        }
      },
      error: (err: any) => {
        console.error('Error al buscar productos:', err);
        this.productosFiltrados = [];
        this.mostrarSugerencias = false;
      }
    });
  }

  seleccionarYAgregar(prod: any) {
    if (!prod.id_articulo) {
      window.alert(`Error: No se encontró un ID válido para "${prod.nombre}".`);
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
        precioOriginal: prod.precioOriginal || prod.precioFinal,
        precioUnitario: prod.precioFinal,
        porcentajeDescuento: prod.porcentajeDescuento || 0,
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
      .map(i => i.porcentajeDescuento > 0 
        ? `${i.cantidad}x ${i.concepto} (-${i.porcentajeDescuento}%)` 
        : `${i.cantidad}x ${i.concepto}`)
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