import { Component, Input, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, 
  IonNote, IonContent, IonItem, IonLabel, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonSearchbar, IonGrid, IonRow, IonCol, 
  IonBadge, IonList, ModalController, IonInfiniteScroll, IonInfiniteScrollContent
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  trashOutline, 
  addCircleOutline, 
  removeCircleOutline, 
  cartOutline, 
  personOutline, 
  checkmarkCircleOutline,
  eyeOutline,
  searchOutline,
  pricetagOutline
} from 'ionicons/icons';

import { ArticulosService } from '../../core/services/articulos.service';
import { OrdenService } from '../../core/services/orden.service';
import { DescuentoService, Promocion } from '../../core/services/descuento.service';
import { Cliente } from '../../shared/interfaces/cliente.interface';

@Component({
  selector: 'app-crrito',
  templateUrl: './crrito.page.html',
  styleUrls: ['./crrito.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonTitle, 
    IonNote, 
    IonContent, 
    IonItem, 
    IonLabel, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonSearchbar, 
    IonGrid, 
    IonRow, 
    IonCol, 
    IonBadge, 
    IonList,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ]
})
export class CrritoPage implements OnInit {
  
  @Input() cliente!: Cliente;
  @Input() folioRx!: string;
  @Input() graduacionLectura!: any;

  private modalCtrl = inject(ModalController);
  private articulosService = inject(ArticulosService);
  private ordenService = inject(OrdenService);
  private descuentoService = inject(DescuentoService);
  private cdr = inject(ChangeDetectorRef);

  articulos: any[] = [];
  carrito: any[] = [];
  total: number = 0;
  promocionesVigentes: Promocion[] = [];
  
  // Parámetros para la paginación y búsqueda real en BD
  paginaActual: number = 1;
  limitePorPagina: number = 20;
  filtroBusqueda: string = '';
  hayMasDatos: boolean = true;

  constructor() {
    addIcons({
      closeOutline,
      trashOutline,
      addCircleOutline,
      removeCircleOutline,
      cartOutline,
      personOutline,
      checkmarkCircleOutline,
      eyeOutline,
      searchOutline,
      pricetagOutline
    });
  }

  ngOnInit() {
    this.cargarPromocionesVigentes();

    // Escuchamos el stream reactivo del servicio de artículos
    this.articulosService.getArticulosStream().subscribe({
      next: (res: any[]) => {
        this.articulos = res.map((item: any) => {
          const precioOriginal = Number(item.precio_venta || item.precio || 0);
          const calculo = this.calcularDescuentoProducto({ ...item, precio_venta: precioOriginal });

          return {
            ...item,
            precio_original: precioOriginal,
            precio_venta: calculo.precioFinal,
            porcentaje_descuento: calculo.porcentaje
          };
        });

        if (res.length > 0 && res.length < (this.paginaActual * this.limitePorPagina)) {
          this.hayMasDatos = false;
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al mapear artículos en carrito:', err)
    });

    this.cargarDatosServidor();
  }

  cargarPromocionesVigentes() {
    this.descuentoService.obtenerDescuentosVigentes().subscribe({
      next: (res: any) => {
        this.promocionesVigentes = res?.datos || res || [];
        if (this.articulos.length > 0) {
          this.articulos = this.articulos.map(item => {
            const precioOrig = item.precio_original || Number(item.precio_venta || 0);
            const calculo = this.calcularDescuentoProducto({ ...item, precio_venta: precioOrig });
            return {
              ...item,
              precio_original: precioOrig,
              precio_venta: calculo.precioFinal,
              porcentaje_descuento: calculo.porcentaje
            };
          });
          this.calcularTotal();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => console.warn('Aviso: no se pudieron cargar descuentos en carrito:', err)
    });
  }

  // 🏷️ Calcula si aplica promoción
  calcularDescuentoProducto(prod: any): { precioFinal: number; porcentaje: number } {
    const precioBase = Number(prod.precio_venta || prod.precio || 0);
    if (!this.promocionesVigentes || this.promocionesVigentes.length === 0) {
      return { precioFinal: precioBase, porcentaje: 0 };
    }

    const idArt = String(prod.id_articulo || prod.id || '');
    const catArt = String(prod.categoria || '').toUpperCase();

    // 1. Por producto específico rezagado
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

    // 2. Por categoría
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

    // 3. Global (Buen Fin)
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

  cargarDatosServidor() {
    this.articulosService.cargarArticulos(
      this.paginaActual, 
      this.limitePorPagina, 
      this.filtroBusqueda
    );
  }

  buscarMaterial(event?: any) {
    const valor = event?.target?.value !== undefined ? event.target.value : this.filtroBusqueda;
    this.filtroBusqueda = valor || '';

    this.paginaActual = 1;
    this.hayMasDatos = true;
    this.cargarDatosServidor();
  }

  cargarMasArticulos(event: any) {
    if (!this.hayMasDatos) {
      event.target.complete();
      return;
    }

    this.paginaActual++;
    this.cargarDatosServidor();

    setTimeout(() => {
      event.target.complete();
    }, 600);
  }

  agregar(item: any) {
    const existe = this.carrito.find(i => i.id_articulo === item.id_articulo);

    if (existe) {
      if (existe.cantidad >= item.stock_actual) {
        alert('No hay más stock disponible en inventario.');
        return;
      }
      existe.cantidad++;
    } else {
      if (item.stock_actual <= 0) {
        alert('Producto sin existencias en stock.');
        return;
      }

      const calculo = this.calcularDescuentoProducto(item);

      this.carrito.push({
        ...item,
        precio_original: item.precio_original || item.precio_venta,
        precio_venta: calculo.precioFinal,
        porcentaje_descuento: calculo.porcentaje,
        cantidad: 1
      });
    }

    this.calcularTotal();
  }

  disminuir(item: any) {
    if (item.cantidad > 1) {
      item.cantidad--;
    } else {
      this.quitar(item);
    }
    this.calcularTotal();
  }

  quitar(item: any) {
    this.carrito = this.carrito.filter(i => i.id_articulo !== item.id_articulo);
    this.calcularTotal();
  }

  calcularTotal() {
    this.total = this.carrito.reduce((sum, i) => sum + (i.precio_venta * i.cantidad), 0);
  }

  validarStock(): boolean {
    for (let item of this.carrito) {
      const producto = this.articulos.find(a => a.id_articulo === item.id_articulo);
      if (!producto) continue;

      if (item.cantidad > producto.stock_actual) {
        alert(`Stock insuficiente para el artículo: ${producto.nombre}`);
        return false;
      }
    }
    return true;
  }

  guardarOrden() {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío. Agrega productos antes de continuar.');
      return;
    }
    
    if (!this.validarStock()) return;

    // Obtener los datos del operador logueado desde localStorage
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || '{}');
    const idOperador = usuarioLogueado.id || usuarioLogueado.id_usuario || 1;

    const orden = {
      id_sucursal: 'HL01',
      id_cliente: this.cliente?.id_cliente || 1,
      id_operador: idOperador, // 👈 Enviamos el ID real del operador
      folio_rx: this.folioRx || null,
      total: this.total,
      detalle: this.carrito.map(i => ({
        id_articulo: i.id_articulo,
        cantidad: i.cantidad,
        precio_unitario: i.precio_venta
      }))
    };

    this.ordenService.crearOrden(orden).subscribe({
      next: (res: any) => {
        const folioGenerado = res?.folio || res?.data?.folio || 'ORD-HL01-' + Date.now();
        
        // 📄 1. LLAMADA AL BACKEND: Usamos la función del servicio para abrir el PDF oficial con "Atendió:"
        this.ordenService.descargarTicketPDF(folioGenerado);

        // 2. Limpiamos carrito y cerramos el modal
        const respuestaSalida = {
          ...res,
          folio: folioGenerado,
          carrito: this.carrito,
          total: this.total
        };

        this.carrito = [];
        this.total = 0;
        this.modalCtrl.dismiss(respuestaSalida, 'confirm');
      },
      error: (err: any) => {
        console.error('Error al guardar la orden desde el mostrador:', err);
        alert('Ocurrió un error al registrar la orden de trabajo en el servidor.');
      }
    });
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}