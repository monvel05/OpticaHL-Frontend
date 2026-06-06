import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { 
  IonHeader, IonToolbar, IonTitle, IonText, IonButtons, IonButton, IonIcon, 
  IonSearchbar, IonContent, IonSegment, IonSegmentButton, IonLabel, IonGrid, 
  IonRow, IonCol, IonThumbnail, IonItem, IonBadge, IonFab, IonFabButton
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
    IonFabButton
  ]
})
export class InventarioPage implements OnInit {
  private inventarioService = inject(InventarioService);
  private modalCtrl = inject(ModalController);

  segmentoActual: string = 'Z'; // Cambiado a 'Z' para coincidir por defecto con el value="Z" de tu ion-segment (Armazones)
  searchTerm: string = '';
  
  // JUAN (UX): Estado del filtro de existencias críticas
  soloAlertas: boolean = false;

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
    // Registramos todos los iconos necesarios, incluyendo los de alertas y servicios agregados en el HTML
    addIcons({
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
      cubeOutline,
      notifications,
      notificationsOutline,
      shieldCheckmarkOutline,
      buildOutline,
      constructOutline
    });
  }

  ngOnInit() {
    // Suscripción al flujo en tiempo real
    this.inventarioService.getArticulosStream().subscribe((data: Articulo[]) => {
      console.log('📦 Datos crudos que están llegando al inventario:', data);
      this.productos = data;
      this.filtrar();
    });

    this.cargarDatos();
  }

  cargarDatos() {
    this.inventarioService.cargarArticulos('HL01');
  }

  cambiarSegmento(event: any) {
    this.segmentoActual = event.detail.value;
    this.filtrar();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value?.toLowerCase() || '';
    this.filtrar();
  }

  /**
   * JUAN (UX): Alterna el estado de la campana de alertas y refresca la lista.
   */
  toggleFiltroAlertas() {
    this.soloAlertas = !this.soloAlertas;
    this.filtrar();
  }

  /**
   * Sistema de filtrado robusto e inteligente.
   * Maneja segmentos, términos de búsqueda de Mariana y el filtro de stock crítico de Juan.
   */
  filtrar() {
    if (this.segmentoActual === 'sucursales') return;

    this.productosFiltrados = this.productos.filter(p => {
      if (!p.categoria) return false;

      // 1. Normalizamos la categoría del producto (Ej: 'Armazón' -> 'ARMAZON')
      const categoriaArticuloNormalizada = p.categoria
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // 2. Normalizamos el valor de la pestaña seleccionada (Ej: 'Z', 'S', 'A', 'SERVICIO')
      const segmentoNormalizado = this.segmentoActual
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // 3. Comprobación flexible para emparejar categorías
      const coincideTipo = categoriaArticuloNormalizada.includes(segmentoNormalizado) || 
                           segmentoNormalizado.includes(categoriaArticuloNormalizada);

      // 4. Filtro de búsqueda por nombre o marca (Mariana)
      const coincideBusqueda = 
        p.nombre.toLowerCase().includes(this.searchTerm) ||
        (p.marca && p.marca.toLowerCase().includes(this.searchTerm));

      // 5. Filtro de Alertas de Stock Crítico (Juan)
      // Si la campana está activa, descartamos conceptos de SERVICIO y verificamos que el stock actual sea menor o igual al mínimo.
      let pasaAlertaStock = true;
      if (this.soloAlertas) {
        const esServicio = categoriaArticuloNormalizada === 'SERVICIO';
        pasaAlertaStock = !esServicio && (Number(p.stock_actual) <= Number(p.stock_minimo));
      }
      
      return coincideTipo && coincideBusqueda && pasaAlertaStock;
    });

    console.log(`🔍 Filtrado terminado para [${this.segmentoActual}]. Alertas: ${this.soloAlertas}. Resultados visibles:`, this.productosFiltrados.length);
  }

  tuFunctionDePrueba(idSeleccionado: any) {
    if (idSeleccionado) {
      const marcaObj = this.marcas.find(m => m.id === idSeleccionado);
      if (marcaObj) {
        this.productosFiltrados = this.productos.filter(p =>
          p.marca === marcaObj.nombre && p.categoria === this.segmentoActual
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
    this.inventarioService.cargarArticulos(sucursal.id);
  }
}