import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import {
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
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  InventarioService,
  Articulo,
} from '../../core/services/inventario.service';
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
  cubeOutline,
  notifications,
  notificationsOutline,
  shieldCheckmarkOutline,
  buildOutline,
  constructOutline,
  createOutline,
  removeOutline,
  cashOutline,
  statsChartOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
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
    IonItem,
    IonBadge,
    IonFab,
    IonFabButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSpinner,
    IonMenuButton,
    IonCard,
    IonRefresher,
    IonRefresherContent
  ],
})
export class InventarioPage implements OnInit {
  private inventarioService = inject(InventarioService);
  private modalCtrl = inject(ModalController);

  segmentoActual: string = 'ARMAZON';
  searchTerm: string = '';
  soloAlertas: boolean = false;
  isLoading: boolean = true;

  page: number = 1;
  limit: number = 50;
  hayMasDatos: boolean = true;
  idSucursalActual: string = 'HL01';

  // KPIs Calculados
  kpiTotalArticulos: number = 0;
  kpiValorTotal: number = 0;
  kpiStockCritico: number = 0;

  productos: Articulo[] = [];
  productosFiltrados: Articulo[] = [];

  sucursales = [
    { id: 'HL01', nombre: 'SUC. MATRIZ', totalArticulos: 120 },
    { id: 'HL02', nombre: 'SUC. PULGAS PANDAS', totalArticulos: 85 },
    { id: 'HL03', nombre: 'SUC. UNIVERSIDAD', totalArticulos: 95 },
    { id: 'HL04', nombre: 'SUC. DEL PARQUE', totalArticulos: 210 },
  ];

  constructor() {
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
      constructOutline,
      createOutline,
      removeOutline,
      cashOutline,
      statsChartOutline
    });
  }

  ngOnInit() {
    this.inventarioService
      .getArticulosStream()
      .subscribe((data: Articulo[]) => {
        this.productos = data;
        this.recalcularKPIs();
        this.filtrar();
        this.isLoading = false;
      });

    this.cargarDatos();
  }

  async cargarDatos() {
    this.page = 1;
    this.hayMasDatos = true;
    this.isLoading = true;

    const trajoMas = await this.inventarioService.cargarArticulos(
      this.idSucursalActual,
      this.segmentoActual,
      this.page,
      this.limit,
      true,
    );

    if (!trajoMas) {
      this.hayMasDatos = false;
    }
  }

  async doRefresh(event: any) {
    await this.cargarDatos();
    event.target.complete();
  }

  async cargarMas(event: any) {
    if (!this.hayMasDatos) {
      event.target.complete();
      return;
    }

    this.page++;

    const trajoMas = await this.inventarioService.cargarArticulos(
      this.idSucursalActual,
      this.segmentoActual,
      this.page,
      this.limit,
      false,
    );

    if (!trajoMas) {
      this.hayMasDatos = false;
    }

    event.target.complete();
  }

  cambiarSegmento(event: any) {
    this.segmentoActual = event.detail.value;
    if (this.segmentoActual !== 'sucursales') {
      this.cargarDatos();
    }
  }

  recalcularKPIs() {
    this.kpiTotalArticulos = this.productos.length;
    this.kpiValorTotal = this.productos.reduce((sum, p) => sum + (Number(p.precio_venta || 0) * Number(p.stock_actual || 0)), 0);
    this.kpiStockCritico = this.productos.filter(p => p.categoria !== 'SERVICIO' && Number(p.stock_actual) <= Number(p.stock_minimo)).length;
  }

  filtrar() {
    if (this.segmentoActual === 'sucursales') return;

    this.productosFiltrados = this.productos.filter(p => {
      const nombreSafe = (p.nombre || '').toLowerCase();
      const marcaSafe = (p.marca || '').toLowerCase();
      const codigoSafe = (p.codigo || '').toLowerCase();

      const coincideBusqueda = 
        nombreSafe.includes(this.searchTerm) ||
        marcaSafe.includes(this.searchTerm) ||
        codigoSafe.includes(this.searchTerm);

      let pasaAlertaStock = true;
      if (this.soloAlertas) {
        const catSafe = (p.categoria || '').toUpperCase();
        const esServicio = catSafe.includes('SERVICIO');
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
        tipoArticulo: this.segmentoActual,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.inventarioService.crearArticulo(data).subscribe({
        next: (res: any) => {
          this.cargarDatos();
        },
        error: (err: any) => console.error('Error al guardar artículo:', err),
      });
    }
  }

  verDetalleSucursal(sucursal: any) {
    this.idSucursalActual = sucursal.id;
    this.cargarDatos();
  }

  async editarProducto(producto: Articulo) {
    const modal = await this.modalCtrl.create({
      component: FormularioArticuloComponent,
      componentProps: {
        tipoArticulo: producto.categoria,
        articuloExistente: producto,
      },
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data) {
      this.cargarDatos();
    }
  }

  async ajustarStock(producto: Articulo, cantidadAjuste: number) {
    if (producto.stock_actual + cantidadAjuste < 0) return;

    producto.stock_actual += cantidadAjuste;
    this.recalcularKPIs();

    this.inventarioService
      .ajustarStockRapido(
        producto.id_articulo!,
        this.idSucursalActual,
        cantidadAjuste,
      )
      .subscribe({
        next: () => {},
        error: (err) => {
          console.error('Error al ajustar stock', err);
          producto.stock_actual -= cantidadAjuste;
          this.recalcularKPIs();
        },
      });
  }
}
