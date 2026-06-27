import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { 
  IonHeader, IonToolbar, IonTitle, IonText, IonButtons, IonButton, IonIcon, 
  IonSearchbar, IonContent, IonSegment, IonSegmentButton, IonLabel, IonGrid, 
  IonRow, IonCol, IonThumbnail, IonItem, IonBadge, IonFab, IonFabButton,
  IonInfiniteScroll, IonInfiniteScrollContent, IonSpinner
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
    IonInfiniteScroll, 
    IonInfiniteScrollContent,
    IonSpinner,
  ]
})
export class InventarioPage implements OnInit {
  private inventarioService = inject(InventarioService);
  private modalCtrl = inject(ModalController);

  segmentoActual: string = 'Z';
  searchTerm: string = '';
  soloAlertas: boolean = false;
  isLoading: boolean = true; 

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
      this.isLoading = false; // Deja de mostrar el spinner al cargar los datos por primera vez
    });

    this.cargarDatos();
  }

  // Resetea la paginación y carga desde el inicio pidiendo datos frescos al Backend
  // AHORA ES ASÍNCRONO PARA EVALUAR SI HAY MÁS DATOS DESDE EL INICIO
  async cargarDatos() {
    this.page = 1;
    this.hayMasDatos = true;
    this.isLoading = true; 
    
    // Le mandamos la pestaña actual (this.segmentoActual) al servicio y esperamos la respuesta
    const trajoMas = await this.inventarioService.cargarArticulos(this.idSucursalActual, this.segmentoActual, this.page, this.limit, true);
    
    // Si la BD devolvió menos de 50 registros en la primera consulta, apagamos el scroll para que no intente pedir la página 2.
    if (!trajoMas) {
      this.hayMasDatos = false;
    }
  }

  // Evento que dispara el Scroll hacia abajo
  async cargarMas(event: any) {
    if (!this.hayMasDatos) {
      event.target.complete();
      return;
    }

    this.page++;
    
    // Pasamos el segmento actual también al cargar más páginas
    const trajoMas = await this.inventarioService.cargarArticulos(this.idSucursalActual, this.segmentoActual, this.page, this.limit, false);
    
    // Si el backend responde que ya no llenó el límite (trajo menos de 50), apagamos la bandera
    if (!trajoMas) {
      this.hayMasDatos = false; 
    }
    
    // SIEMPRE debemos completar el evento para que Ionic quite la bolita girando del fondo
    event.target.complete();
  }

  cambiarSegmento(event: any) {
    this.segmentoActual = event.detail.value;
    
    if (this.segmentoActual !== 'sucursales') {
      // Al cambiar de pestaña, obligamos al sistema a traer los datos nuevos de ESA categoría desde la BD
      this.cargarDatos(); 
    }
  }

  // Filtro puramente visual (para buscador de texto y botón de stock bajo)
  filtrar() {
    if (this.segmentoActual === 'sucursales') return;

    this.productosFiltrados = this.productos.filter(p => {
      // 1. Filtro de Búsqueda de texto
      const coincideBusqueda = 
        p.nombre.toLowerCase().includes(this.searchTerm) ||
        (p.marca && p.marca.toLowerCase().includes(this.searchTerm));

      // 2. Filtro de Campana de Stock Crítico
      let pasaAlertaStock = true;
      if (this.soloAlertas) {
        const cat = p.categoria ? p.categoria.toUpperCase() : '';
        const esServicio = cat.includes('SERVICIO');
        pasaAlertaStock = !esServicio && (Number(p.stock_actual) <= Number(p.stock_minimo));
      }
      
      return coincideBusqueda && pasaAlertaStock;
    });
  }


  onSearchChange(event: any) {
    this.searchTerm = event.detail.value?.toLowerCase() || '';
    this.filtrar();
  }

  toggleFiltroAlertas() {
    this.soloAlertas = !this.soloAlertas;
    this.filtrar();
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
          this.cargarDatos(); // Refresca la lista para mostrar el nuevo artículo
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