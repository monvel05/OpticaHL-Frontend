import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
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
  searchOutline // 🔍 Agregamos icono de búsqueda
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
  imports: [IonicModule, CommonModule, FormsModule]
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
  
  // 🔍 Variable para la barra de búsqueda de materiales
  filtroBusqueda: string = '';

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
    this.articulosService.getArticulosStream().subscribe({
      next: (res: any) => {
        console.log('📦 Productos recibidos en carrito:', res);
        if (Array.isArray(res)) {
          this.articulos = res;
        } else if (res && Array.isArray(res.data)) {
          this.articulos = res.data;
        } else if (res && Array.isArray(res.articulos)) {
          this.articulos = res.articulos;
        } else {
          this.articulos = [];
        }
      },
      error: (err) => console.error('Error al mapear artículos en carrito:', err)
    });

    this.articulosService.cargarArticulos();
  }

  /**
   * 🔎 GETTER REACTIVO: Filtra los artículos en tiempo real por Nombre o por Código.
   * Si la barra está vacía, devuelve todos los artículos.
   */
  get articulosFiltrados(): any[] {
    if (!this.filtroBusqueda || this.filtroBusqueda.trim() === '') {
      return this.articulos;
    }
    
    const termino = this.filtroBusqueda.toLowerCase().trim();
    
    return this.articulos.filter(articulo => {
      // Validamos contra 'nombre' y contra su propiedad de código (ajusta 'codigo' o 'id_articulo' según tu BD)
      const coincideNombre = articulo.nombre ? articulo.nombre.toLowerCase().includes(termino) : false;
      const coincideCodigo = articulo.id_articulo ? String(articulo.id_articulo).toLowerCase().includes(termino) : false;
      const coincideCodigoAlterno = articulo.codigo ? String(articulo.codigo).toLowerCase().includes(termino) : false;
      
      return coincideNombre || coincideCodigo || coincideCodigoAlterno;
    });
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