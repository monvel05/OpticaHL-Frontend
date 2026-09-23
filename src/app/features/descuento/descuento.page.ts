import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonMenuButton,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  pricetagOutline,
  trashOutline,
  pauseOutline,
  playOutline,
  closeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { DescuentoService, Promocion } from '../../core/services/descuento.service';
import { CajaService } from '../../core/services/caja.service';

@Component({
  selector: 'app-descuento',
  templateUrl: './descuento.page.html',
  styleUrls: ['./descuento.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonMenuButton,
    IonSpinner
  ]
})
export class DescuentoPage implements OnInit {
  private descuentoService = inject(DescuentoService);
  private cajaService = inject(CajaService);
  private cdr = inject(ChangeDetectorRef);

  listaPromociones: Promocion[] = [];
  cargando: boolean = true;
  mostrarModalCrear: boolean = false;

  // Formulario nuevo descuento
  nuevoDescuento: Partial<Promocion> = {
    nombre: '',
    descripcion: '',
    porcentaje_descuento: 10,
    tipo_aplicacion: 'TODOS',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  // Para búsqueda de producto rezagado
  busquedaProducto: string = '';
  productosSugeridos: any[] = [];
  productoSeleccionadoNombre: string = '';

  constructor() {
    addIcons({
      addCircleOutline,
      pricetagOutline,
      trashOutline,
      pauseOutline,
      playOutline,
      closeOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.cargarPromociones();
  }

  ionViewWillEnter() {
    this.cargarPromociones();
  }

  get kpiVigentes(): number {
    return this.listaPromociones.filter(p => p.estado_actual === 'VIGENTE').length;
  }

  get kpiProgramadas(): number {
    return this.listaPromociones.filter(p => p.estado_actual === 'PROGRAMADO').length;
  }

  private obtenerIdDinamico(p: any): number | string | undefined {
    if (!p) return undefined;
    const idDirecto = p.id_articulo ?? p.id ?? p.id_producto ?? p.idArticulo ?? p.id_item ?? p.id_inventario;
    if (idDirecto !== undefined && idDirecto !== null) return idDirecto;

    const llaves = Object.keys(p);
    const llaveId = llaves.find(k => k.toLowerCase().includes('id') || k.toLowerCase().includes('clave'));
    return llaveId ? p[llaveId] : undefined;
  }

  cargarPromociones() {
    this.cargando = true;
    this.descuentoService.obtenerDescuentos().subscribe({
      next: (res: any) => {
        this.listaPromociones = res?.datos || res || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar descuentos:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  getColorBadge(estado?: string): string {
    switch (estado) {
      case 'VIGENTE': return '#10b981';
      case 'PROGRAMADO': return '#3b82f6';
      case 'PAUSADO': return '#f59e0b';
      case 'VENCIDO': return '#64748b';
      default: return '#64748b';
    }
  }

  abrirModalCrear() {
    this.nuevoDescuento = {
      nombre: '',
      descripcion: '',
      porcentaje_descuento: 10,
      tipo_aplicacion: 'TODOS',
      categoria: 'ARMAZON',
      id_articulo: null,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    this.productoSeleccionadoNombre = '';
    this.busquedaProducto = '';
    this.productosSugeridos = [];
    this.mostrarModalCrear = true;
    this.cdr.detectChanges();
  }

  buscarProductoParaRebaja(event: any) {
    const val = (event?.detail?.value || event?.target?.value || '').trim();
    if (!val) {
      this.productosSugeridos = [];
      return;
    }

    this.cajaService.buscarProductosInventario(val).subscribe({
      next: (prods: any[]) => {
        this.productosSugeridos = (prods || []).map(p => {
          const id = this.obtenerIdDinamico(p);
          return {
            id_articulo: id,
            nombre: p.nombre || p.descripcion || 'Sin nombre',
            precio: Number(p.precio || p.precio_venta || 0),
            stock: Number(p.stock_actual ?? p.stock ?? 0)
          };
        });
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error buscando productos:', err);
      }
    });
  }

    seleccionarProductoParaRebaja(p: any) {
    const id = this.obtenerIdDinamico(p);
    this.nuevoDescuento.id_articulo = id ? Number(id) : null; // <-- Convertido a número
    this.productoSeleccionadoNombre = `${p.nombre} (ID #${id} - Precio: $${p.precio})`;
    this.productosSugeridos = [];
    this.busquedaProducto = '';
    this.cdr.detectChanges();
  }
  guardarPromocion() {
    const nombre = (this.nuevoDescuento.nombre || '').trim();
    const porcentaje = Number(this.nuevoDescuento.porcentaje_descuento);

    if (!nombre) {
      window.alert('Por favor escribe el nombre de la promoción.');
      return;
    }

    if (isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
      window.alert('Por favor ingresa un porcentaje de descuento válido (entre 1 y 100).');
      return;
    }

    if (!this.nuevoDescuento.fecha_inicio || !this.nuevoDescuento.fecha_fin) {
      window.alert('Por favor selecciona las fechas de inicio y fin.');
      return;
    }

    if (this.nuevoDescuento.tipo_aplicacion === 'PRODUCTO' && !this.nuevoDescuento.id_articulo) {
      window.alert('Por favor busca y selecciona un producto de la lista sugerida.');
      return;
    }

    this.descuentoService.crearDescuento(this.nuevoDescuento).subscribe({
      next: () => {
        window.alert('¡Promoción registrada con éxito!');
        this.mostrarModalCrear = false;
        this.cargarPromociones();
      },
      error: (err: any) => {
        console.error('Error creando promoción:', err);
        window.alert(err.error?.mensaje || 'Error al guardar la promoción en el servidor.');
      }
    });
  }

  toggleEstado(promo: Promocion) {
    if (!promo.id_promocion) return;

    this.descuentoService.cambiarEstado(promo.id_promocion).subscribe({
      next: () => this.cargarPromociones(),
      error: (err: any) => console.error('Error al cambiar estado:', err)
    });
  }

  eliminar(promo: Promocion) {
    if (!promo.id_promocion) return;
    if (!window.confirm(`¿Estás seguro de eliminar la promoción "${promo.nombre}"?`)) return;

    this.descuentoService.eliminarDescuento(promo.id_promocion).subscribe({
      next: () => this.cargarPromociones(),
      error: (err: any) => console.error('Error al eliminar:', err)
    });
  }
}

export { DescuentoPage as DescuentosPage };