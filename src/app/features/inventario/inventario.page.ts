import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { SelectorEntidadComponent } from '../../shared/components/selector-entidad/selector-entidad.component';
import { InventarioService } from '../../core/services/inventario.service';
import { FormularioArticuloComponent } from '../../shared/components/formulario-articulo/formulario-articulo.component';


import {
  add,
  addOutline,
  searchOutline,
  alertCircleOutline,
  pricetagOutline,
  businessOutline,
  glassesOutline,
  eyeOutline,
  watchOutline,
  refreshOutline,
  checkmarkCircleOutline, 
  cubeOutline             
} from 'ionicons/icons';

// Definimos una interfaz sencilla para tener orden
interface Producto {
  id: number;
  nombre: string;
  marca: string;
  cantidad: number;
  stockMinimo: number;
  tipo: string;
}

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, SelectorEntidadComponent]
})
export class InventarioPage implements OnInit {

  segmentoActual: string = 'armazones';
  searchTerm: string = '';

  marcas = [
    { id: 1, nombre: 'Ray-Ban' },
    { id: 2, nombre: 'Oakley' },
    { id: 3, nombre: 'Vogue' },
    { id: 4, nombre: 'Arnette' }
  ];

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  sucursales = [
    { id: 2, nombre: 'SUC.VILLAASUNCION', totalArticulos: 120 },
    { id: 3, nombre: 'SUC.PULGASPANDAS', totalArticulos: 85 },
    { id: 4, nombre: 'SUC.DELPARQUE', totalArticulos: 210 },
    { id: 5, nombre: 'SUC.UNIVERSIDAD', totalArticulos: 95 },
    { id: 6, nombre: 'SUC.CUAUHTEMOC', totalArticulos: 130 }
  ];

  constructor(
    private inventarioService: InventarioService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      add,
      'add-outline': addOutline,
      'search-outline': searchOutline,
      'alert-circle-outline': alertCircleOutline,
      'pricetag-outline': pricetagOutline,
      'business-outline': businessOutline,
      'glasses-outline': glassesOutline,
      'eye-outline': eyeOutline,
      'watch-outline': watchOutline,
      'refresh-outline': refreshOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'cube-outline': cubeOutline                        
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.inventarioService.getInventario().subscribe({
      next: (data) => {
        this.productos = data;
        this.filtrar();
      },
      error: (err) => {
        console.warn('Backend no disponible, usando locales.');
        this.productos = [
          { id: 1, nombre: 'Ray-Ban Aviator', marca: 'Ray-Ban', cantidad: 2, stockMinimo: 5, tipo: 'armazones' },
          { id: 2, nombre: 'Oakley Sport', marca: 'Oakley', cantidad: 10, stockMinimo: 3, tipo: 'armazones' },
          { id: 3, nombre: 'Líquido Limpiador', marca: 'Splash', cantidad: 1, stockMinimo: 5, tipo: 'accesorios' },
        ];
        this.filtrar();
      }
    });
  }

  cambiarSegmento(event: any) {
    this.segmentoActual = event.detail.value;
    this.filtrar();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value?.toLowerCase() || '';
    this.filtrar();
  }

  filtrar() {
    
    if (this.segmentoActual === 'sucursales') return;

    this.productosFiltrados = this.productos.filter(p => {
      const coincideTipo = p.tipo === this.segmentoActual;
      const coincideBusqueda = p.nombre.toLowerCase().includes(this.searchTerm) ||
        p.marca.toLowerCase().includes(this.searchTerm);
      return coincideTipo && coincideBusqueda;
    });
  }

  tuFuncionDePrueba(idSeleccionado: any) {
    if (idSeleccionado) {
      const marcaObj = this.marcas.find(m => m.id === idSeleccionado);
      if (marcaObj) {
        this.productosFiltrados = this.productos.filter(p =>
          p.marca === marcaObj.nombre && p.tipo === this.segmentoActual
        );
      }
    } else {
      this.filtrar();
    }
  }

  async agregarProducto() {
    const modal = await this.modalCtrl.create({
      component: FormularioArticuloComponent,
      componentProps: {
        tipoArticulo: this.segmentoActual
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    // Dentro de agregarProducto() en inventario.page.ts:
    if (data) {
      this.inventarioService.crearProducto(data).subscribe({
        next: (res) => {
          console.log('¡Producto guardado!', res);
          this.cargarDatos(); // Para que aparezca en la lista sin refrescar manual
        },
        error: (err) => console.error('Error al guardar', err)
      });
    }
  }

  verDetalleSucursal(sucursal: any) {
    console.log('Navegando a detalle de:', sucursal.nombre);
  }
}