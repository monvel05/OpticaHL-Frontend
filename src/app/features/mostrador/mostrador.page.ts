import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, AlertController } from '@ionic/angular/standalone';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonIcon,
  IonButtons, IonSearchbar, IonButton, IonGrid, IonRow, IonCol,
  IonCard, IonItem, IonAvatar, IonLabel, IonFabButton, IonMenuButton,
  IonModal, IonList, IonCardContent, IonInput, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import jsPDF from 'jspdf';

// Servicios
import { AuthService } from 'src/app/core/services/auth.service';
import { ClienteService } from 'src/app/core/services/cliente.service';
import { ArticulosService } from '../../core/services/articulos.service';
import { DescuentoService, Promocion } from '../../core/services/descuento.service';
import { Cliente } from '../../shared/interfaces/cliente.interface';

// Modales
import { ClienteFormComponent } from '../../shared/components/cliente-form/cliente-form.component';
import { HistorialOrdenComponent } from '../../shared/components/historial-orden/historial-orden.component';
import { CrritoPage } from '../crrito/crrito.page';

// Iconos
import {
  refreshOutline, searchOutline, callOutline, folderOpenOutline,
  documentTextOutline, personAdd, closeOutline, checkmarkCircleOutline,
  logOutOutline, calculatorOutline, addCircleOutline, trashOutline, cartOutline,
  barcodeOutline, printOutline, removeCircleOutline, pricetagOutline
} from 'ionicons/icons';

interface ItemCotizacion {
  id_articulo?: number;
  descripcion: string;
  precioOriginal: number;
  precio: number;
  porcentajeDescuento: number;
  cantidad: number;
}

@Component({
  selector: 'app-mostrador',
  templateUrl: './mostrador.page.html',
  styleUrls: ['./mostrador.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    IonFabButton, IonLabel, IonAvatar, IonItem, IonCard, IonCol,
    IonRow, IonGrid, IonButton, IonSearchbar, IonButtons, IonIcon,
    IonFab, IonContent, IonHeader, IonTitle, IonToolbar, IonMenuButton,
    IonModal, IonList, IonCardContent, IonInput, IonBadge,
    CommonModule
  ]
})
export class MostradorPage implements OnInit {
  private clienteService = inject(ClienteService);
  private articulosService = inject(ArticulosService);
  private descuentoService = inject(DescuentoService);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);

  searchTerm: string = '';
  clientesFiltrados: Cliente[] = [];

  // 🧮 Cotizador State
  isCotizadorOpen: boolean = false;
  busquedaProductoTexto: string = '';
  mostrarSugerencias: boolean = false;
  promocionesVigentes: Promocion[] = [];
  
  todosLosProductos: any[] = [];
  productosFiltrados: any[] = [];
  productoSeleccionado: { 
    id_articulo?: number; 
    codigo?: string; 
    nombre: string; 
    precio_original: number;
    precio_venta: number; 
    porcentaje_descuento: number;
  } | null = null;
  itemsCotizacion: ItemCotizacion[] = [];

  constructor() {
    addIcons({
      calculatorOutline, refreshOutline, logOutOutline, searchOutline, callOutline,
      folderOpenOutline, documentTextOutline, personAdd, closeOutline, addCircleOutline,
      trashOutline, cartOutline, checkmarkCircleOutline, barcodeOutline, printOutline,
      removeCircleOutline, pricetagOutline
    });
  }

  ngOnInit() {
    this.clientesFiltrados = [];
    this.cargarPromocionesVigentes();

    this.articulosService.getArticulosStream().subscribe({
      next: (articulos: any[]) => {
        this.todosLosProductos = articulos.map((item: any) => {
          const precioOriginal = Number(item.precio_venta || item.precio || 0);
          const calculo = this.calcularDescuentoProducto({ ...item, precio_venta: precioOriginal });

          return {
            id_articulo: item.id_articulo,
            codigo: item.codigo || item.codigo_barras || item.sku || '',
            nombre: item.nombre || item.descripcion || 'Sin nombre',
            categoria: item.categoria || '',
            precio_original: precioOriginal,
            precio_venta: calculo.precioFinal,
            porcentaje_descuento: calculo.porcentaje
          };
        });
      },
      error: (err: any) => console.error('Error al cargar artículos:', err)
    });
  }

  ionViewWillEnter() {
    this.cargarPromocionesVigentes();
  }

  cargarPromocionesVigentes() {
    this.descuentoService.obtenerDescuentosVigentes().subscribe({
      next: (res: any) => {
        this.promocionesVigentes = res?.datos || res || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.warn('Aviso: no se pudieron cargar descuentos en mostrador:', err)
    });
  }

  // 🏷️ Calcula si aplica promoción a un artículo
  calcularDescuentoProducto(prod: any): { precioFinal: number; porcentaje: number } {
    const precioBase = Number(prod.precio_venta || prod.precio || 0);
    if (!this.promocionesVigentes || this.promocionesVigentes.length === 0) {
      return { precioFinal: precioBase, porcentaje: 0 };
    }

    const idArt = String(prod.id_articulo || prod.id || '');
    const catArt = String(prod.categoria || '').toUpperCase();

    // 1. Por producto rezagado
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

  async logout() {
    await this.authService.logout();
  }

  onSearchChange(event: any) {
    const valor = event?.detail?.value || event?.target?.value || '';
    this.searchTerm = valor.toString().trim().toLowerCase();

    if (this.searchTerm === '') {
      this.clientesFiltrados = [];
      return;
    }

    this.clienteService.buscarClientes(this.searchTerm).subscribe({
      next: (data: any) => {
        this.clientesFiltrados = this.normalizarRespuestaClientes(data);
      },
      error: (err: any) => {
        console.error('Error en búsqueda de clientes:', err);
        this.clientesFiltrados = [];
      }
    });
  }

  private normalizarRespuestaClientes(data: any): Cliente[] {
    if (Array.isArray(data)) return data;
    if (data?.clientes && Array.isArray(data.clientes)) return data.clientes;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.result && Array.isArray(data.result)) return data.result;
    return [];
  }

  cargarClientes() {
    if (this.searchTerm !== '') {
      this.onSearchChange({ detail: { value: this.searchTerm } });
    }
  }

  obtenerInicial(nombreCompleto: string): string {
    if (!nombreCompleto) return 'C';
    return nombreCompleto.trim().charAt(0).toUpperCase();
  }

  // 🧮 LÓGICA COTIZADOR
  abrirCotizador() {
    this.isCotizadorOpen = true;
    this.busquedaProductoTexto = '';
    this.mostrarSugerencias = false;
    this.productosFiltrados = [];
    this.cargarPromocionesVigentes();
    this.articulosService.cargarArticulos(1, 50, '');
  }

  cerrarCotizador() {
    this.isCotizadorOpen = false;
    this.mostrarSugerencias = false;
    this.busquedaProductoTexto = '';
  }

  buscarProductoInventario(event: any) {
    const query = (event?.detail?.value || event?.target?.value || '').toString().toLowerCase().trim();
    this.busquedaProductoTexto = query;

    if (!query) {
      this.mostrarSugerencias = false;
      this.productosFiltrados = [];
      return;
    }

    this.productosFiltrados = this.todosLosProductos
      .filter(prod => {
        const nombreMatch = prod.nombre.toLowerCase().includes(query);
        const codigoMatch = prod.codigo.toLowerCase().includes(query);
        return nombreMatch || codigoMatch;
      })
      .map(prod => {
        const calculo = this.calcularDescuentoProducto(prod);
        return {
          ...prod,
          precio_venta: calculo.precioFinal,
          porcentaje_descuento: calculo.porcentaje
        };
      });

    this.mostrarSugerencias = true;
    this.articulosService.cargarArticulos(1, 20, query);
  }

  seleccionarProducto(producto: any) {
    const calculo = this.calcularDescuentoProducto(producto);

    this.productoSeleccionado = {
      id_articulo: producto.id_articulo,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio_original: producto.precio_original || producto.precio_venta,
      precio_venta: calculo.precioFinal,
      porcentaje_descuento: calculo.porcentaje
    };
    
    this.mostrarSugerencias = false;
    this.busquedaProductoTexto = '';
    this.productosFiltrados = [];
  }

  agregarItemCotizacion() {
    if (this.productoSeleccionado) {
      const etiquetaProd = this.productoSeleccionado.codigo 
        ? `[${this.productoSeleccionado.codigo}] ${this.productoSeleccionado.nombre}`
        : this.productoSeleccionado.nombre;

      const itemExistente = this.itemsCotizacion.find(
        item => item.id_articulo === this.productoSeleccionado?.id_articulo && item.descripcion === etiquetaProd
      );

      if (itemExistente) {
        itemExistente.cantidad += 1;
      } else {
        this.itemsCotizacion.push({
          id_articulo: this.productoSeleccionado.id_articulo,
          descripcion: etiquetaProd,
          precioOriginal: this.productoSeleccionado.precio_original,
          precio: Number(this.productoSeleccionado.precio_venta),
          porcentajeDescuento: this.productoSeleccionado.porcentaje_descuento,
          cantidad: 1
        });
      }

      this.productoSeleccionado = null;
    }
  }

  incrementarCantidad(item: ItemCotizacion) {
    item.cantidad = (item.cantidad || 0) + 1;
  }

  decrementarCantidad(item: ItemCotizacion) {
    if (item.cantidad > 1) {
      item.cantidad -= 1;
    }
  }

  onCantidadChange(event: any, item: ItemCotizacion) {
    const valorRaw = event?.detail?.value || event?.target?.value;
    const num = parseInt(valorRaw, 10);
    item.cantidad = isNaN(num) || num < 1 ? 1 : num;
  }

  eliminarItemCotizacion(index: number) {
    this.itemsCotizacion.splice(index, 1);
  }

  calcularTotalCotizacion(): number {
    return this.itemsCotizacion.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  }

  limpiarCotizacion() {
    this.itemsCotizacion = [];
    this.productoSeleccionado = null;
    this.productosFiltrados = [];
    this.mostrarSugerencias = false;
    this.busquedaProductoTexto = '';
  }

  // 📄 CONFIRMAR E IMPRIMIR
  async confirmarEImprimirCotizacion() {
    if (this.itemsCotizacion.length === 0) {
      this.cerrarCotizador();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Imprimir Cotización',
      message: '¿Deseas imprimir el ticket de esta cotización con sus descuentos aplicados?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          handler: () => {
            this.limpiarCotizacion();
            this.cerrarCotizador();
          }
        },
        {
          text: 'Sí, Imprimir',
          handler: () => {
            this.imprimirPDF();
            this.limpiarCotizacion();
            this.cerrarCotizador();
          }
        }
      ]
    });

    await alert.present();
  }

  imprimirPDF() {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 160]
    });

    const fechaHora = new Date().toLocaleString();

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ÓPTICA - COTIZACIÓN', 40, 10, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Fecha: ${fechaHora}`, 5, 16);
    doc.text('-----------------------------------------------------------', 5, 20);

    doc.setFont('Helvetica', 'bold');
    doc.text('Cant. Descrip.', 5, 25);
    doc.text('P.Unit', 55, 25, { align: 'right' });
    doc.text('Importe', 75, 25, { align: 'right' });
    doc.text('-----------------------------------------------------------', 5, 28);

    doc.setFont('Helvetica', 'normal');
    let y = 33;

    this.itemsCotizacion.forEach((item) => {
      let desc = item.descripcion.length > 18 ? item.descripcion.substring(0, 16) + '..' : item.descripcion;
      if (item.porcentajeDescuento > 0) {
        desc += ` (-${item.porcentajeDescuento}%)`;
      }
      const subtotal = item.precio * item.cantidad;

      doc.text(`${item.cantidad}x ${desc}`, 5, y);
      doc.text(`$${item.precio.toFixed(2)}`, 55, y, { align: 'right' });
      doc.text(`$${subtotal.toFixed(2)}`, 75, y, { align: 'right' });
      y += 6;
    });

    doc.text('-----------------------------------------------------------', 5, y);
    y += 5;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL:', 5, y);
    doc.text(`$${this.calcularTotalCotizacion().toFixed(2)}`, 75, y, { align: 'right' });

    y += 10;
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Precios con descuentos vigentes incluidos.', 40, y, { align: 'center' });
    doc.text('¡Gracias por su preferencia!', 40, y + 5, { align: 'center' });

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  // MÉTODOS DE CLIENTES E HISTORIAL
  verHistorial(cliente: Cliente) {
    if (!cliente.id_cliente) return;

    this.clienteService.obtenerHistorial(cliente.id_cliente).subscribe({
      next: async (res: any) => {
        const clinico = res?.data?.clinico || (Array.isArray(res) ? res : []);
        const materiales = res?.data?.materiales || [];

        const modal = await this.modalCtrl.create({
          component: HistorialOrdenComponent,
          componentProps: {
            nombreCliente: cliente.nombre_completo,
            historialClinico: clinico,
            historialMateriales: materiales
          }
        });

        await modal.present();
      },
      error: (err: any) => console.error('Error al obtener el historial:', err)
    });
  }

  async crearOrden(cliente: Cliente) {
    if (!cliente.id_cliente) return;

    this.clienteService.obtenerHistorial(cliente.id_cliente).subscribe({
      next: async (res: any) => {
        const listaClinica = res?.data?.clinico || (Array.isArray(res) ? res : []);

        if (!listaClinica || listaClinica.length === 0) {
          alert(`El cliente ${cliente.nombre_completo} no tiene ninguna graduación registrada.`);
          return;
        }

        const ultimaReceta = listaClinica[0];

        const modalCarrito = await this.modalCtrl.create({
          component: CrritoPage,
          componentProps: {
            cliente: cliente,
            folioRx: ultimaReceta.folio || 'RX-' + cliente.id_cliente,
            graduacionLectura: {
              od_esfera: ultimaReceta.od_esfera,
              od_cilindro: ultimaReceta.od_cilindro,
              od_eje: ultimaReceta.od_eje,
              od_adicion: ultimaReceta.od_adicion,
              oi_esfera: ultimaReceta.oi_esfera,
              oi_cilindro: ultimaReceta.oi_cilindro,
              oi_eje: ultimaReceta.oi_eje,
              oi_adicion: ultimaReceta.oi_adicion,
              observaciones: ultimaReceta.observaciones || 'Sin notas.'
            }
          }
        });

        await modalCarrito.present();

        const resultCarrito = await modalCarrito.onDidDismiss();
        if (resultCarrito.role === 'confirm') {
          this.clientesFiltrados = [];
          this.searchTerm = '';
        }
      },
      error: (err: any) => {
        console.error('Error al conectar con la receta:', err);
        alert('Hubo un inconveniente al conectar con el servidor.');
      }
    });
  }

  async registrarNuevoCliente() {
    const modal = await this.modalCtrl.create({
      component: ClienteFormComponent,
      cssClass: 'modal-formulario-cliente'
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data) {
      this.clientesFiltrados = [data];
      this.searchTerm = data.nombre_completo || '';
    }
  }
}