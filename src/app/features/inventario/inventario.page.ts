import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { 
  IonHeader, IonToolbar, IonTitle, IonText, IonButtons, IonButton, IonIcon, 
  IonSearchbar, IonContent, IonSegment, IonSegmentButton, IonLabel, IonGrid, 
  IonRow, IonCol, IonThumbnail, IonItem, IonBadge, IonFab, IonFabButton,
  IonInfiniteScroll, IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { SelectorEntidadComponent } from '../../shared/components/selector-entidad/selector-entidad.component';
import { InventarioService, Articulo } from '../../core/services/inventario.service';
import { FormularioArticuloComponent } from '../../shared/components/formulario-articulo/formulario-articulo.component';

import {
  add, addOutline, searchOutline, alertCircleOutline, pricetagOutline,
  businessOutline, glassesOutline, eyeOutline, watchOutline, refreshOutline,
  checkmarkCircleOutline, cubeOutline, notifications, notificationsOutline, shieldCheckmarkOutline, buildOutline, constructOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonText, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonSearchbar, 
    IonContent, 
    IonSegment, 
    IonSegmentButton, 
    IonLabel, 
    IonGrid, 
    IonRow, 
    IonCol, 
    IonThumbnail, 
    IonItem, 
    IonBadge, 
    IonFab, 
    IonFabButton,
    IonInfiniteScroll, // IMPORTADO
    IonInfiniteScrollContent // IMPORTADO
  ]
})
export class InventarioPage implements OnInit {
  private inventarioService = inject(InventarioService);
  private modalCtrl = inject(ModalController);

  segmentoActual: string = 'Z';
  searchTerm: string = '';
  soloAlertas: boolean = false;

  // Variables de Paginación y Sucursal
  page: number = 1;
  limit: number = 50;
  hayMasDatos: boolean = true;
  idSucursalActual: string = 'HL01';

  marcas = [
    { id: 1, nombre: 'Ray-Ban' },
    { id: 2, nombre: 'Oakley' },
    { id: 3, nombre: 'Vogue' },
    { id: 4, nombre: 'Arnette' }
  ];

  productos: Articulo[] = [];
  productosFiltrados: Articulo[] = [];

  sucursales = [
    { id: 'HL01', nombre: 'SUC. MATRIZ', totalArticulos: 120 },
    { id: 'HL02', nombre: 'SUC. PULGAS PANDAS', totalArticulos: 85 },
    { id: 'HL03', nombre: 'SUC. UNIVERSIDAD', totalArticulos: 95 },
    { id: 'HL04', nombre: 'SUC. DEL PARQUE', totalArticulos: 210 }
  ];

  constructor() {
    addIcons({
      add, addOutline, searchOutline, alertCircleOutline, pricetagOutline,
      businessOutline, glassesOutline, eyeOutline, watchOutline, refreshOutline,
      checkmarkCircleOutline, cubeOutline, notifications, notificationsOutline, shieldCheckmarkOutline, buildOutline, constructOutline
    });
  }

  ngOnInit() {
    this.inventarioService.getArticulosStream().subscribe((data: Articulo[]) => {
      this.productos = data;
      this.filtrar(); // Se re-filtra automáticamente al llegar nuevos datos
    });

    this.cargarDatos();
  }

  // Resetea la paginación y carga desde el inicio
  cargarDatos() {
    this.page = 1;
    this.hayMasDatos = true;
    this.inventarioService.cargarArticulos(this.idSucursalActual, this.page, this.limit, true);
  }

  // Evento que dispara el Scroll
  async cargarMas(event: any) {
    if (!this.hayMasDatos) {
      event.target.complete();
      event.target.disabled = true;
      return;
    }

    this.page++;
    // El false indica que queremos "concatenar", no resetear
    const trajoMas = await this.inventarioService.cargarArticulos(this.idSucursalActual, this.page, this.limit, false);
    
    if (!trajoMas) {
      this.hayMasDatos = false; // Ya no hay más páginas en la base de datos
      event.target.disabled = true;
    }
    event.target.complete();
  }

  cambiarSegmento(event: any) {
    this.segmentoActual = event.detail.value;
    this.filtrar();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value?.toLowerCase() || '';
    this.filtrar();
  }

  toggleFiltroAlertas() {
    this.soloAlertas = !this.soloAlertas;
    this.filtrar();
  }

  filtrar() {
    if (this.segmentoActual === 'sucursales') return;

    this.productosFiltrados = this.productos.filter(p => {
      if (!p.categoria) return false;

      const categoriaArticuloNormalizada = p.categoria
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const segmentoNormalizado = this.segmentoActual
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const coincideTipo = categoriaArticuloNormalizada.includes(segmentoNormalizado) || 
                           segmentoNormalizado.includes(categoriaArticuloNormalizada);

      const coincideBusqueda = 
        p.nombre.toLowerCase().includes(this.searchTerm) ||
        (p.marca && p.marca.toLowerCase().includes(this.searchTerm));

      let pasaAlertaStock = true;
      if (this.soloAlertas) {
        const esServicio = categoriaArticuloNormalizada === 'SERVICIO';
        pasaAlertaStock = !esServicio && (Number(p.stock_actual) <= Number(p.stock_minimo));
      }
      
      return coincideTipo && coincideBusqueda && pasaAlertaStock;
    });
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
    if (data) {
      this.inventarioService.crearArticulo(data).subscribe({
        next: (res: any) => {
          console.log('¡Producto guardado mediante la API!', res);
        },
        error: (err: any) => console.error('Error al guardar artículo:', err)
      });
    }
  }

  verDetalleSucursal(sucursal: any) {
    console.log('Filtrando inventario por sucursal:', sucursal.nombre);
    this.idSucursalActual = sucursal.id;
    this.cargarDatos(); 
  }
}