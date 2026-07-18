import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, 
  IonNote, IonContent, IonItem, IonLabel, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonSearchbar, IonGrid, IonRow, IonCol, 
  IonBadge, IonList, ModalController 
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
    IonList
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
   * Reinicia la paginación y le pide al backend que busque sobre los 34,000 registros.
   */
buscarMaterial(event?: any) {
    // Si el evento trae directamente el valor del ion-searchbar lo capturamos, si no, usamos la propiedad vinculada
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

    // Le damos un pequeño respiro a la UI para completar la animación del scroll
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
        const folioGenerado = res?.folio || 'OPT-001';
        alert(`¡Orden creada con éxito!\n\nPor favor, indique al paciente su Folio de seguimiento: ${folioGenerado}`);
        this.carrito = [];
        this.total = 0;
        this.modalCtrl.dismiss(res, 'confirm');
      },
      error: (err) => {
        console.error('Error al guardar la orden desde el mostrador:', err);
        alert('Ocurrió un error al registrar la orden de trabajo en el servidor.');
      }
    });
  }

  cerrar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}