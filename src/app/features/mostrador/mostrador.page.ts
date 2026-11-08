import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController, AlertController, ToastController } from '@ionic/angular/standalone';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonFab, IonIcon,
  IonButtons, IonSearchbar, IonButton, IonGrid, IonRow, IonCol,
  IonCard, IonItem, IonAvatar, IonLabel, IonFabButton, IonMenuButton,
  IonModal, IonList, IonCardContent, IonInput, IonBadge, IonSpinner,
  IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import jsPDF from 'jspdf';

// Servicios
import { AuthService } from 'src/app/core/services/auth.service';
import { ClienteService } from 'src/app/core/services/cliente.service';
import { ArticulosService } from '../../core/services/articulos.service';
import { DescuentoService, Promocion } from '../../core/services/descuento.service';
import { TrasladoService, ArticuloUniversal, SolicitudTraslado, FichaSalidaData } from '../../core/services/traslado.service';
import { Cliente } from '../../shared/interfaces/cliente.interface';

// Modales
import { ClienteFormComponent } from '../../shared/components/cliente-form/cliente-form.component';
import { HistorialOrdenComponent } from '../../shared/components/historial-orden/historial-orden.component';
import { CrritoPage } from '../crrito/crrito.page';
import { BotonSoporteComponent } from '../../shared/components/boton-soporte/boton-soporte.component';

// Iconos
import {
  refreshOutline, searchOutline, callOutline, folderOpenOutline,
  documentTextOutline, personAdd, closeOutline, checkmarkCircleOutline,
  logOutOutline, calculatorOutline, addCircleOutline, trashOutline, cartOutline,
  barcodeOutline, printOutline, removeCircleOutline, pricetagOutline,
  globeOutline, swapHorizontalOutline, receiptOutline, arrowForwardCircleOutline,
  checkmarkDoneOutline, documentAttachOutline, downloadOutline, businessOutline,
  checkmarkOutline, arrowForwardOutline, alertCircleOutline
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
    BotonSoporteComponent,
    CommonModule,
    FormsModule,
    IonFabButton, IonLabel, IonAvatar, IonItem, IonCard, IonCol,
    IonRow, IonGrid, IonButton, IonSearchbar, IonButtons, IonIcon,
    IonFab, IonContent, IonHeader, IonTitle, IonToolbar, IonMenuButton,
    IonModal, IonList, IonCardContent, IonInput, IonBadge, IonSpinner,
    IonSegment, IonSegmentButton
  ]
})
export class MostradorPage implements OnInit, OnDestroy {
  private clienteService = inject(ClienteService);
  private articulosService = inject(ArticulosService);
  private descuentoService = inject(DescuentoService);
  private trasladoService = inject(TrasladoService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
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

  // 🌐 Buscador Universal State
  isBuscadorUniversalOpen: boolean = false;
  busquedaUniversalTexto: string = '';
  cargandoUniversal: boolean = false;
  articulosUniversales: ArticuloUniversal[] = [];
  sucursalesCatalogo: any[] = [];
  sucursalActualId: string = 'HL01';

  // 📦 Solicitudes de Traspaso / Fichas de Salida State
  isModalTraspasosOpen: boolean = false;
  solicitudesTraspaso: SolicitudTraslado[] = [];
  cargandoSolicitudes: boolean = false;
  solicitudesPendientesCount: number = 0;
  filtroEstatusTraspaso: string = 'TODOS';
  private intervaloTraspasos: any = null;

  get esAdmin(): boolean {
    return this.authService.obtenerRolesActuales().some(r => r.toUpperCase().includes('ADMIN'));
  }

  constructor() {
    addIcons({
      calculatorOutline, refreshOutline, logOutOutline, searchOutline, callOutline,
      folderOpenOutline, documentTextOutline, personAdd, closeOutline, addCircleOutline,
      trashOutline, cartOutline, checkmarkCircleOutline, barcodeOutline, printOutline,
      removeCircleOutline, pricetagOutline, globeOutline, swapHorizontalOutline,
      receiptOutline, arrowForwardCircleOutline, checkmarkDoneOutline, documentAttachOutline,
      downloadOutline, businessOutline, checkmarkOutline, arrowForwardOutline, alertCircleOutline
    });

    this.obtenerSucursalActiva();

    this.authService.currentUser$.subscribe(u => {
      if (u && u.id_sucursal) {
        this.sucursalActualId = String(u.id_sucursal);
        this.cargarConteoTraspasos();
      }
    });
  }

  ngOnInit() {
    this.obtenerSucursalActiva();
    this.clientesFiltrados = [];
    this.cargarPromocionesVigentes();
    this.cargarConteoTraspasos();

    if (this.intervaloTraspasos) clearInterval(this.intervaloTraspasos);
    this.intervaloTraspasos = setInterval(() => {
      this.cargarConteoTraspasos();
    }, 20000);

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
    this.cargarConteoTraspasos();
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

  cargarConteoTraspasos() {
    this.trasladoService.obtenerSolicitudes(this.sucursalActualId, 'PENDIENTE').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.solicitudesPendientesCount = res.data.length;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
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

    // 3. Global
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

  // ==========================================
  // 🌐 BUSCADOR UNIVERSAL MULTI-SUCURSAL
  // ==========================================

  abrirBuscadorUniversal() {
    this.isBuscadorUniversalOpen = true;
    this.busquedaUniversalTexto = '';
    this.buscarUniversal();
  }

  cerrarBuscadorUniversal() {
    this.isBuscadorUniversalOpen = false;
    this.busquedaUniversalTexto = '';
  }

  buscarUniversal() {
    this.cargandoUniversal = true;
    this.trasladoService.buscarUniversal(this.busquedaUniversalTexto).subscribe({
      next: (res) => {
        this.cargandoUniversal = false;
        if (res.success) {
          this.sucursalesCatalogo = res.sucursales || [];
          this.articulosUniversales = res.data || [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoUniversal = false;
        console.error('Error en buscador universal:', err);
        this.mostrarToast('Error al consultar stock multi-sucursal.', 'danger');
      }
    });
  }

  async pedirTraspaso(articulo: ArticuloUniversal, idSucursalOrigen: string, sucursalOrigenNombre: string, stockDisponible: number) {
    if (stockDisponible <= 0) {
      this.mostrarToast('Esta sucursal no tiene unidades disponibles.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Solicitar Traspaso',
      subHeader: `${articulo.nombre} (${articulo.codigo})`,
      message: `Stock en ${sucursalOrigenNombre}: ${stockDisponible} unidades disponibles. Indica la cantidad a solicitar hacia tu sucursal.`,
      inputs: [
        {
          name: 'cantidad',
          type: 'number',
          min: 1,
          max: stockDisponible,
          value: 1,
          placeholder: 'Cantidad'
        },
        {
          name: 'motivo',
          type: 'text',
          placeholder: 'Motivo o paciente solicitante'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar Solicitud',
          handler: (data) => {
            const cant = parseInt(data.cantidad, 10);
            if (!cant || cant <= 0 || cant > stockDisponible) {
              this.mostrarToast(`La cantidad debe ser entre 1 y ${stockDisponible}.`, 'warning');
              return false;
            }

            this.trasladoService.crearSolicitud({
              id_articulo: articulo.id_articulo,
              id_sucursal_origen: idSucursalOrigen,
              id_sucursal_destino: this.sucursalActualId,
              cantidad: cant,
              motivo: data.motivo || 'Solicitud de mostrador'
            }).subscribe({
              next: (resp) => {
                this.mostrarToast(resp.message || 'Solicitud de traspaso enviada con éxito.', 'success');
                this.cargarConteoTraspasos();
                this.buscarUniversal();
              },
              error: (err) => {
                this.mostrarToast(err.error?.message || 'Error al enviar solicitud.', 'danger');
              }
            });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  // ==========================================
  // 📦 SOLICITUDES DE TRASPASO & FICHAS DE SALIDA
  // ==========================================

  abrirModalTraspasos() {
    this.isModalTraspasosOpen = true;
    this.cargarSolicitudesTraspaso();
  }

  cerrarModalTraspasos() {
    this.isModalTraspasosOpen = false;
  }

  cargarSolicitudesTraspaso() {
    this.cargandoSolicitudes = true;
    this.trasladoService.obtenerSolicitudes(this.sucursalActualId, this.filtroEstatusTraspaso).subscribe({
      next: (res) => {
        this.cargandoSolicitudes = false;
        if (res.success) {
          this.solicitudesTraspaso = res.data || [];
          this.solicitudesPendientesCount = this.solicitudesTraspaso.filter(s => s.estatus === 'PENDIENTE').length;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoSolicitudes = false;
        console.error('Error al cargar traspasos:', err);
      }
    });
  }

  async responderTraspaso(solicitud: SolicitudTraslado, accion: 'ACEPTAR' | 'RECHAZAR') {
    const accionTexto = accion === 'ACEPTAR' ? 'aceptar y generar ficha de salida para' : 'rechazar';

    const alert = await this.alertCtrl.create({
      header: `${accion === 'ACEPTAR' ? 'Aceptar' : 'Rechazar'} Solicitud`,
      message: `¿Estás seguro de ${accionTexto} el traspaso del folio ${solicitud.folio} (${solicitud.cantidad} pzs de ${solicitud.nombre_articulo}) hacia ${solicitud.sucursal_destino}? ${accion === 'ACEPTAR' ? 'Se descontará automáticamente del inventario.' : ''}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: accion === 'ACEPTAR' ? 'Aceptar y Descargar Ficha' : 'Rechazar',
          role: accion === 'RECHAZAR' ? 'destructive' : undefined,
          handler: () => {
            this.trasladoService.responderSolicitud(solicitud.id_solicitud, accion).subscribe({
              next: async (res) => {
                this.mostrarToast(res.message || 'Traspaso actualizado.', 'success');
                if (accion === 'ACEPTAR') {
                  this.descargarFichaSalidaPDF(solicitud.id_solicitud);
                }
                this.cargarSolicitudesTraspaso();
              },
              error: (err) => {
                this.mostrarToast(err.error?.message || 'Error al responder solicitud.', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmarRecepcion(solicitud: SolicitudTraslado) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Recepción de Mercancía',
      message: `¿Confirmas que recibiste físicamente ${solicitud.cantidad} pzs de "${solicitud.nombre_articulo}" enviadas desde ${solicitud.sucursal_origen}? Se sumará a tu inventario.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar y Recibir',
          handler: () => {
            this.trasladoService.recibirSolicitud(solicitud.id_solicitud).subscribe({
              next: (res) => {
                this.mostrarToast(res.message || 'Mercancía recibida e ingresada al inventario.', 'success');
                this.cargarSolicitudesTraspaso();
              },
              error: (err) => {
                this.mostrarToast(err.error?.message || 'Error al confirmar recepción.', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  descargarFichaSalidaPDF(idSolicitud: number) {
    this.trasladoService.obtenerFichaSalida(idSolicitud).subscribe({
      next: (res) => {
        if (!res.success || !res.data) {
          this.mostrarToast('No se encontraron datos para la ficha.', 'warning');
          return;
        }

        const f: FichaSalidaData = res.data;
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'letter'
        });

        // ENCABEZADO
        doc.setFillColor(30, 64, 175); // Azul primario elegante
        doc.rect(0, 0, 216, 28, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('HOSPITAL DE LENTES - ÓPTICA HL', 108, 12, { align: 'center' });

        doc.setFontSize(11);
        doc.text('FICHA DE SALIDA Y TRASPASO INTER-SUCURSAL', 108, 20, { align: 'center' });

        // METADATOS DEL FOLIO
        doc.setTextColor(33, 37, 41);
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'bold');
        doc.text(`FOLIO DE TRASLADO: ${f.folio}`, 14, 38);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Fecha Solicitud: ${new Date(f.fecha_solicitud).toLocaleString('es-MX')}`, 14, 44);
        if (f.fecha_autorizacion) {
          doc.text(`Fecha Autorización: ${new Date(f.fecha_autorizacion).toLocaleString('es-MX')}`, 14, 50);
        }
        doc.text(`Estatus Actual: ${f.estatus}`, 150, 38);

        // RECUADRO ORIGEN Y DESTINO
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(248, 250, 252);

        // Origen
        doc.rect(14, 56, 90, 34, 'FD');
        doc.setFont('Helvetica', 'bold');
        doc.text('SUCURSAL DE ORIGEN (ENTREGA):', 18, 62);
        doc.setFont('Helvetica', 'normal');
        doc.text(`${f.sucursal_origen_nombre} (${f.sucursal_origen_id})`, 18, 68);
        doc.text(`Dir: ${f.sucursal_origen_direccion || 'N/A'}`, 18, 74);
        doc.text(`Tel: ${f.sucursal_origen_telefono || 'N/A'}`, 18, 80);
        doc.text(`Autorizó: ${f.operador_autoriza || 'Encargado'}`, 18, 86);

        // Destino
        doc.rect(112, 56, 90, 34, 'FD');
        doc.setFont('Helvetica', 'bold');
        doc.text('SUCURSAL DE DESTINO (RECIBE):', 116, 62);
        doc.setFont('Helvetica', 'normal');
        doc.text(`${f.sucursal_destino_nombre} (${f.sucursal_destino_id})`, 116, 68);
        doc.text(`Dir: ${f.sucursal_destino_direccion || 'N/A'}`, 116, 74);
        doc.text(`Tel: ${f.sucursal_destino_telefono || 'N/A'}`, 116, 80);
        doc.text(`Solicitó: ${f.operador_solicita || 'Mostrador'}`, 116, 86);

        // TABLA DE ARTÍCULOS
        doc.setFillColor(226, 232, 240);
        doc.rect(14, 98, 188, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.text('CÓDIGO', 18, 103);
        doc.text('DESCRIPCIÓN DEL PRODUCTO', 55, 103);
        doc.text('CANTIDAD', 145, 103);
        doc.text('P. VENTA', 180, 103);

        doc.setFont('Helvetica', 'normal');
        doc.rect(14, 106, 188, 14);
        doc.text(f.codigo || 'S/C', 18, 114);
        doc.text(`${f.nombre} ${f.marca ? '(' + f.marca + ')' : ''}`, 55, 114);
        doc.setFont('Helvetica', 'bold');
        doc.text(`${f.cantidad} pza(s)`, 145, 114);
        doc.setFont('Helvetica', 'normal');
        doc.text(`$${Number(f.precio_venta || 0).toFixed(2)}`, 180, 114);

        // MOTIVO / OBSERVACIONES
        doc.setFont('Helvetica', 'bold');
        doc.text('Motivo / Observaciones del Traspaso:', 14, 130);
        doc.setFont('Helvetica', 'italic');
        doc.text(f.motivo || 'Traspaso de inventario inter-sucursales para atención a cliente.', 14, 136);

        // RECUADRO DE FIRMAS
        doc.setFont('Helvetica', 'normal');
        doc.line(25, 200, 95, 200);
        doc.text('Firma y Nombre de quien Entrega', 60, 206, { align: 'center' });
        doc.setFont('Helvetica', 'bold');
        doc.text(f.sucursal_origen_nombre, 60, 212, { align: 'center' });

        doc.setFont('Helvetica', 'normal');
        doc.line(121, 200, 191, 200);
        doc.text('Firma y Nombre de quien Recibe', 156, 206, { align: 'center' });
        doc.setFont('Helvetica', 'bold');
        doc.text(f.sucursal_destino_nombre, 156, 212, { align: 'center' });

        // PIE DE PÁGINA
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Comprobante oficial de control interno de inventario multi-sucursal - Óptica Hospital de Lentes.', 108, 255, { align: 'center' });

        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      },
      error: (err) => {
        console.error('Error al generar PDF de ficha:', err);
        this.mostrarToast('Error al generar comprobante de ficha de salida.', 'danger');
      }
    });
  }

  // ==========================================
  // 🧾 ACCIONES DE FACTURACIÓN EN MOSTRADOR
  // ==========================================

  irAFacturacion() {
    this.router.navigate(['/facturacion']);
  }

  facturarCliente(cliente: Cliente) {
    this.router.navigate(['/facturacion'], {
      queryParams: {
        cliente: cliente.nombre_completo,
        id_cliente: cliente.id_cliente
      }
    });
  }

  // ==========================================
  // 🧮 LÓGICA COTIZADOR
  // ==========================================
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
      format: [80, 170]
    });

    const fechaHora = new Date().toLocaleString();
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || '{}');
    const nombreAtendio = usuarioLogueado.nombre || usuarioLogueado.nombre_completo || 'MOSTRADOR';

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ÓPTICA - COTIZACIÓN', 40, 10, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Fecha: ${fechaHora}`, 5, 16);
    
    doc.setFont('Helvetica', 'bold');
    doc.text(`Atendió: ${nombreAtendio.toUpperCase()}`, 5, 20);

    doc.setFont('Helvetica', 'normal');
    doc.text('-----------------------------------------------------------', 5, 24);

    doc.setFont('Helvetica', 'bold');
    doc.text('Cant. Descrip.', 5, 29);
    doc.text('P.Unit', 55, 29, { align: 'right' });
    doc.text('Importe', 75, 29, { align: 'right' });
    doc.text('-----------------------------------------------------------', 5, 32);

    doc.setFont('Helvetica', 'normal');
    let y = 37;

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

  private async mostrarToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
