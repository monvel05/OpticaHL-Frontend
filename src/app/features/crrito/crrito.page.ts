import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, 
  IonNote, IonContent, IonItem, IonLabel, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonSearchbar, IonGrid, IonRow, IonCol, 
  IonBadge, IonList, ModalController , IonInfiniteScroll, IonInfiniteScrollContent
} from '@ionic/angular/standalone';

// Importaciones de PDF corregidas
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  searchOutline 
} from 'ionicons/icons';

import { ArticulosService } from '../../core/services/articulos.service';
import { OrdenService } from '../../core/services/orden.service';
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

  articulos: any[] = [];
  carrito: any[] = [];
  total: number = 0;
  
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
      searchOutline
    });
  }

  ngOnInit() {
    // Escuchamos el stream reactivo del servicio
    this.articulosService.getArticulosStream().subscribe({
      next: (res: any[]) => {
        console.log('📦 Productos actualizados en el componente:', res);
        this.articulos = res;

        // Si los registros actuales son menores que lo que se espera acumular por página, 
        // significa que ya alcanzamos el total en la base de datos.
        if (res.length > 0 && res.length < (this.paginaActual * this.limitePorPagina)) {
          this.hayMasDatos = false;
        }
      },
      error: (err) => console.error('Error al mapear artículos en carrito:', err)
    });

    // Realizamos la primera carga limpia (Página 1, vacía)
    this.cargarDatosServidor();
  }

  /**
   * Centraliza la petición al servicio pasándole los parámetros actuales
   */
  cargarDatosServidor() {
    this.articulosService.cargarArticulos(
      this.paginaActual, 
      this.limitePorPagina, 
      this.filtroBusqueda
    );
  }

  /**
   * Ejecutado por el (ionInput) o el botón de búsqueda.
   * Reinicia la paginación y le pide al backend que busque sobre los registros.
   */
  buscarMaterial(event?: any) {
    const valor = event?.target?.value !== undefined ? event.target.value : this.filtroBusqueda;
    this.filtroBusqueda = valor || '';

    this.paginaActual = 1;
    this.hayMasDatos = true;
    this.cargarDatosServidor();
  }

  /**
   * Evento disparado cuando el usuario llega al final de la lista en el HTML
   */
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
      this.carrito.push({
        ...item,
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

    const orden = {
      id_sucursal: 'HL01',
      id_cliente: this.cliente?.id_cliente || 1,
      id_operador: 1,
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
        
        // 📄 1. Generamos e imprimimos el PDF del ticket automáticamente
        this.generarPDFNota(folioGenerado);

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
      error: (err) => {
        console.error('Error al guardar la orden desde el mostrador:', err);
        alert('Ocurrió un error al registrar la orden de trabajo en el servidor.');
      }
    });
  }

  /**
   * 📄 GENERACIÓN DE TICKET EN PDF
   */
  public generarPDFNota(folio: string) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Tamaño Ticket (80mm)
    });

    // Encabezado
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ÓPTICA HL', 40, 10, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Nota de Venta / Orden de Trabajo', 40, 15, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Folio: ${folio}`, 40, 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 40, 23, { align: 'center' });

    // Datos del Cliente
    const nombreCliente = this.cliente?.nombre_completo || 'Cliente General';
    doc.text(`Cliente: ${nombreCliente}`, 5, 29);

    // Tabla de Productos Comprados
    const cuerpoTabla = this.carrito.map((item: any) => [
      item.nombre || item.descripcion || 'Producto',
      item.cantidad || 1,
      `$${((item.precio_venta || item.precio || 0) * (item.cantidad || 1)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Producto', 'Cant.', 'Total']],
      body: cuerpoTabla.length > 0 ? cuerpoTabla : [['Sin productos', '0', '$0.00']],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [0, 128, 0] },
      margin: { left: 5, right: 5 }
    });

    // Total General
    const finalY = (doc as any).lastAutoTable?.finalY || 50;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: $${Number(this.total).toFixed(2)}`, 75, finalY + 6, { align: 'right' });

    // Mensaje Final
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('¡Gracias por su preferencia!', 40, finalY + 12, { align: 'center' });

    // Abrir ventana lista para imprimir
    doc.output('dataurlnewwindow');
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}