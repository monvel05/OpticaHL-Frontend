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
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  InventarioService,
  Articulo,
} from '../../core/services/inventario.service';
import { AuthService } from '../../core/services/auth.service';
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
  statsChartOutline,
  funnelOutline
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
    IonRefresherContent,
    IonSelect,
    IonSelectOption
  ],
})
export class InventarioPage implements OnInit {
  private inventarioService = inject(InventarioService);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);

  segmentoActual: string = 'ARMAZON';
  searchTerm: string = '';
  soloAlertas: boolean = false;
  isLoading: boolean = true;

  // Filtro de Sucursal: 'TODAS' o 'POR_SUCURSAL'
  sucursalModo: 'TODAS' | 'POR_SUCURSAL' = 'TODAS';
  idSucursalActual: string = 'HL01';

  page: number = 1;
  limit: number = 50;
  hayMasDatos: boolean = true;

  // KPIs Calculados
  kpiTotalArticulos: number = 0;
  kpiValorTotal: number = 0;
  kpiStockCritico: number = 0;

  productos: Articulo[] = [];
  productosFiltrados: Articulo[] = [];

  sucursales: { id: string; nombre: string }[] = [];

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
      statsChartOutline,
      funnelOutline
    });
  }

  ngOnInit() {
    this.inventarioService.obtenerSucursales().subscribe((sucs) => {
      if (sucs && sucs.length > 0) {
        this.sucursales = sucs.map(s => ({
          id: String(s.id_sucursal),
          nombre: s.nombre || `Sucursal ${s.id_sucursal}`
        }));
      } else {
        this.sucursales = [
          { id: 'HL01', nombre: 'Matriz Hospital de Lentes' },
          { id: 'HL02', nombre: 'Sucursal Norte' }
        ];
      }

      // Si el usuario tiene una sucursal en sesión, tomarla si coincide
      const userSuc = this.authService.obtenerSucursalActual();
      if (userSuc) {
        const sucStr = typeof userSuc === 'number' ? `HL0${userSuc}` : String(userSuc);
        if (this.sucursales.some(s => s.id === sucStr)) {
          this.idSucursalActual = sucStr;
        } else if (this.sucursales.length > 0) {
          this.idSucursalActual = this.sucursales[0].id;
        }
      } else if (this.sucursales.length > 0) {
        this.idSucursalActual = this.sucursales[0].id;
      }
    });

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

    const sucursalTarget = this.sucursalModo === 'TODAS' ? 'TODAS' : this.idSucursalActual;

    const trajoMas = await this.inventarioService.cargarArticulos(
      sucursalTarget,
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

    const sucursalTarget = this.sucursalModo === 'TODAS' ? 'TODAS' : this.idSucursalActual;

    const trajoMas = await this.inventarioService.cargarArticulos(
      sucursalTarget,
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

  onSucursalModoChange(modo: 'TODAS' | 'POR_SUCURSAL') {
    this.sucursalModo = modo;
    this.cargarDatos();
  }

  onSucursalSelectChange(event: any) {
    this.idSucursalActual = event.detail.value;
    if (this.sucursalModo === 'POR_SUCURSAL') {
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
        tipoArticulo: this.segmentoActual === 'sucursales' ? 'ARMAZON' : this.segmentoActual,
      },
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.cargarDatos();
    }
  }

  verDetalleSucursal(sucursal: any) {
    this.sucursalModo = 'POR_SUCURSAL';
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

  // AJUSTE DE STOCK RÁPIDO CON EL SPINNER (+ / -)
  // Se aplica directamente a la sucursal de la sesión del usuario o la sucursal activa
  async ajustarStock(producto: Articulo, cantidadAjuste: number) {
    if (producto.stock_actual + cantidadAjuste < 0) return;

    // Determinar la sucursal a la que se le suma/resta stock
    let sucursalAfectar = this.idSucursalActual;
    const userSuc = this.authService.obtenerSucursalActual();
    if (userSuc) {
      sucursalAfectar = typeof userSuc === 'number' ? `HL0${userSuc}` : userSuc;
    }

    // Actualización visual en la interfaz
    producto.stock_actual += cantidadAjuste;
    this.recalcularKPIs();

    this.inventarioService
      .ajustarStockRapido(
        producto.id_articulo!,
        sucursalAfectar,
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
