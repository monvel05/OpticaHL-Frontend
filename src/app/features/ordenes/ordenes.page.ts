import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ArticulosService } from '../../core/auth/services/articulos.service';
import { OrdenesService } from '../../core/auth/services/ordenes.service';
import { CajaService } from '../../core/auth/services/caja.service';

@Component({
  selector: 'app-ordenes',
  templateUrl: './ordenes.page.html',
  styleUrls: ['./ordenes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class OrdenesPage implements OnInit {

  articulos: any[] = [];
  carrito: any[] = [];
  total: number = 0;

  metodoPago: string = 'EFECTIVO';

  constructor(
    private articulosService: ArticulosService,
    private ordenesService: OrdenesService,
    private cajaService: CajaService
  ) {}

  ngOnInit() {
    // escuchar catálogo reactivo
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
        alert('No hay más stock disponible');
        return;
      }

      existe.cantidad++;

    } else {

      if (item.stock_actual <= 0) {
        alert('Producto sin stock');
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
  // VALIDAR STOCK
  // =========================
  validarStock(): boolean {

    for (let item of this.carrito) {

      const producto = this.articulos.find(a => a.id_articulo === item.id_articulo);

      if (!producto) continue;

      if (item.cantidad > producto.stock_actual) {
        alert(`Stock insuficiente para ${producto.nombre}`);
        return false;
      }
    }

    return true;
  };
  disminuir(item: any) {

  if (item.cantidad > 1) {
    item.cantidad--;
  } else {
    this.quitar(item);
  }

  this.calcularTotal();
}

  // =========================
  // GUARDAR ORDEN
  // =========================
  guardarOrden() {

    if (!this.validarStock()) return;

    const orden = {
      id_sucursal: 'HL01',
      id_cliente: 1,
      id_operador: 1,
      total: this.total,
      detalle: this.carrito.map(i => ({
        id_articulo: i.id_articulo,
        cantidad: i.cantidad,
        precio_unitario: i.precio_venta
      }))
    };

    this.ordenesService.crearOrden(orden).subscribe({
      next: (res: any) => {

        // REGISTRAR EN CAJA
        const movimiento = {
          id_sucursal: 'HL01',
          id_operador: 1,
          folio_orden: res?.folio || null,
          tipo_movimiento: 'INGRESO',
          metodo_pago: this.metodoPago,
          monto: this.total,
          concepto: 'Venta de productos'
        };

        this.cajaService.registrarMovimiento(movimiento).subscribe(() => {
          alert('Orden guardada y registrada en caja');
        });

        // limpiar carrito
        this.carrito = [];
        this.total = 0;

        // refrescar catálogo/inventario
        this.articulosService.cargarArticulos();
      },
      error: (err) => {
        console.error('Error al guardar orden', err);
        alert('Error al guardar la orden');
      }
    });
  }
}
