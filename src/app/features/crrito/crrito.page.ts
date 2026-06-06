import { Component, Input, OnInit, inject } from '@angular/core';
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
  checkmarkCircleOutline 
} from 'ionicons/icons';

import { ArticulosService } from '../../core/services/articulos.service';
import { OrdenService } from '../../core/services/orden.service';
import { Cliente } from '../../shared/interfaces/cliente.interface';

@Component({
  selector: 'app-crrito',
  templateUrl: './crrito.page.html',
  styleUrls: ['./crrito.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CrritoPage implements OnInit {
  
  // DATOS DINÁMICOS INYECTADOS EN CASCADA DESDE EL MOSTRADOR
  @Input() cliente!: Cliente;
  @Input() folioRx!: string;

  private modalCtrl = inject(ModalController);
  private articulosService = inject(ArticulosService);
  private ordenService = inject(OrdenService);

  articulos: any[] = [];
  carrito: any[] = [];
  total: number = 0;

  constructor() {
    // Registramos los iconos estéticos requeridos para la vista del carrito
    addIcons({
      closeOutline,
      trashOutline,
      addCircleOutline,
      removeCircleOutline,
      cartOutline,
      personOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    // Escuchar el catálogo reactivo de productos del inventario
    this.articulosService.getArticulosStream().subscribe(data => {
      this.articulos = data;
    });

    this.articulosService.cargarArticulos();
  }

  // =========================
  // AGREGAR AL CARRITO
  // =========================
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

  // =========================
  // DISMINUIR CANTIDAD
  // =========================
  disminuir(item: any) {
    if (item.cantidad > 1) {
      item.cantidad--;
    } else {
      this.quitar(item);
    }
    this.calcularTotal();
  }

  // =========================
  // QUITAR DEL CARRITO
  // =========================
  quitar(item: any) {
    this.carrito = this.carrito.filter(i => i.id_articulo !== item.id_articulo);
    this.calcularTotal();
  }

  // =========================
  // CALCULAR TOTAL
  // =========================
  calcularTotal() {
    this.total = this.carrito.reduce((sum, i) =>
      sum + (i.precio_venta * i.cantidad), 0);
  }

  // =========================
  // VALIDAR STOCK (Antes de enviar la orden)
  // =========================
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

  // =========================
  // GUARDAR ORDEN (Preventa en Espera de Pago)
  // =========================
  guardarOrden() {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío. Agrega productos antes de continuar.');
      return;
    }
    
    if (!this.validarStock()) return;

    // Construimos la estructura exacta para la orden de trabajo
    const orden = {
      id_sucursal: 'HL01',
      id_cliente: this.cliente?.id_cliente || 1, // Si es venta sin registro usa el ID General (1)
      id_operador: 1,
      folio_rx: this.folioRx || null, // Relación directa con la receta médica guardada en el paso anterior
      total: this.total,
      detalle: this.carrito.map(i => ({
        id_articulo: i.id_articulo,
        cantidad: i.cantidad,
        precio_unitario: i.precio_venta
      }))
    };

    // Almacenamos la orden en MySQL mediante el Backend
    this.ordenService.crearOrden(orden).subscribe({
      next: (res: any) => {
        // Obtenemos el folio que generó tu base de datos o simulamos uno en su defecto
        const folioGenerado = res?.folio || 'OPT-001';
        
        alert(`¡Orden creada con éxito!\n\nPor favor, indique al paciente su Folio de seguimiento: ${folioGenerado}`);

        // Limpiamos los estados locales de este componente modal
        this.carrito = [];
        this.total = 0;

        // Cerramos el modal devolviendo la respuesta al Mostrador para resetear el buscador
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