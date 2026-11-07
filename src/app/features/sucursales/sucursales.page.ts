import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonBadge, IonButton, IonIcon, 
  IonSkeletonText, IonButtons, IonMenuButton, IonSearchbar, IonSelect, 
  IonSelectOption, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, 
  IonCardContent, 
  IonRefresher, IonRefresherContent, ModalController, ToastController, AlertController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  businessOutline, addCircleOutline, searchOutline, filterOutline, 
  gridOutline, listOutline, createOutline, trashOutline, powerOutline, 
  logOutOutline, refreshOutline, checkmarkCircleOutline, closeCircleOutline, 
  locationOutline, sparklesOutline, callOutline
} from 'ionicons/icons';

import { SucursalesService, Sucursal, FiltrosSucursal } from '../../core/services/sucursales.service';
import { ModalSucursalComponent } from '../../shared/components/modal-sucursal/modal-sucursal.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { BotonSoporteComponent } from '../../shared/components/boton-soporte/boton-soporte.component';

@Component({
  selector: 'app-sucursales',
  templateUrl: './sucursales.page.html',
  styleUrls: ['./sucursales.page.scss'],
  standalone: true,
  imports: [
    BotonSoporteComponent,
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonBadge, IonButton, IonIcon, 
    IonSkeletonText, IonButtons, IonMenuButton, IonSearchbar, IonSelect, 
    IonSelectOption, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, 
    IonCardContent, 
    IonRefresher, IonRefresherContent
  ]
})
export class SucursalesPage implements OnInit {
  private sucursalesService = inject(SucursalesService);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);

  // Estados Reactivos
  public cargando = signal<boolean>(true);
  public sucursales = signal<Sucursal[]>([]);
  public vistaModo: 'CARDS' | 'TABLE' = 'CARDS';

  // Filtros
  public filtros: FiltrosSucursal = {
    activo: 'all',
    busqueda: ''
  };

  // KPIs
  public kpiTotal = 0;
  public kpiActivas = 0;
  public kpiInactivas = 0;

  constructor() {
    addIcons({
      businessOutline, addCircleOutline, searchOutline, filterOutline, 
      gridOutline, listOutline, createOutline, trashOutline, powerOutline, 
      logOutOutline, refreshOutline, checkmarkCircleOutline, closeCircleOutline, 
      locationOutline, sparklesOutline, callOutline
    });
  }

  ngOnInit() {
    this.cargarSucursales();
  }

  cargarSucursales(event?: any) {
    this.cargando.set(true);

    this.sucursalesService.obtenerSucursales(this.filtros).subscribe({
      next: (data) => {
        this.sucursales.set(data);
        this.recalcularKPIs(data);
        this.cargando.set(false);
        if (event) event.target.complete();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar sucursales:', err);
        this.cargando.set(false);
        if (event) event.target.complete();
        this.mostrarToast('Error al consultar lista de sucursales.', 'danger');
      }
    });
  }

  recalcularKPIs(lista: Sucursal[]) {
    this.kpiTotal = lista.length;
    this.kpiActivas = lista.filter(s => s.activo).length;
    this.kpiInactivas = lista.filter(s => !s.activo).length;
  }

  onSearchChange(event: any) {
    const val = event.detail?.value || '';
    this.filtros.busqueda = val;
    this.cargarSucursales();
  }

  onFiltroChange() {
    this.cargarSucursales();
  }

  async abrirModalNuevaSucursal() {
    const modal = await this.modalCtrl.create({
      component: ModalSucursalComponent
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data === true) {
      this.cargarSucursales();
    }
  }

  async abrirModalEditarSucursal(suc: Sucursal) {
    const modal = await this.modalCtrl.create({
      component: ModalSucursalComponent,
      componentProps: {
        sucursalActual: suc
      }
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data === true) {
      this.cargarSucursales();
    }
  }

  async confirmarCambioEstado(suc: Sucursal, event?: Event) {
    if (event) event.stopPropagation();

    const nuevoEstado = !suc.activo;
    const accionTexto = nuevoEstado ? 'activar' : 'desactivar';

    const alert = await this.alertCtrl.create({
      header: `¿Deseas ${accionTexto} esta sucursal?`,
      message: `La sucursal "${suc.nombre}" quedará en estado ${nuevoEstado ? 'activo' : 'inactivo'}.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: nuevoEstado ? 'Activar' : 'Desactivar',
          handler: () => {
            this.ejecutarCambioEstado(suc, nuevoEstado);
          }
        }
      ]
    });

    await alert.present();
  }

  private ejecutarCambioEstado(suc: Sucursal, nuevoEstado: boolean) {
    this.sucursalesService.cambiarEstadoSucursal(suc.id_sucursal, nuevoEstado).subscribe({
      next: (res) => {
        if (res.exito !== false) {
          this.mostrarToast(res.mensaje || 'Estado actualizado con éxito.', 'success');
          this.cargarSucursales();
        } else {
          this.mostrarToast(res.mensaje || 'Error al actualizar estado.', 'danger');
        }
      },
      error: () => this.mostrarToast('Error de comunicación con el servidor.', 'danger')
    });
  }

  async confirmarEliminacion(suc: Sucursal, event?: Event) {
    if (event) event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar sucursal?',
      message: `¿Estás seguro de que deseas eliminar permanentemente la sucursal "${suc.nombre}" (${suc.id_sucursal})? Si contiene registros vinculados, será desactivada automáticamente.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.ejecutarEliminacion(suc.id_sucursal);
          }
        }
      ]
    });

    await alert.present();
  }

  private ejecutarEliminacion(id: string) {
    this.sucursalesService.eliminarSucursal(id).subscribe({
      next: (res) => {
        if (res.exito !== false) {
          const color = res.desactivado ? 'warning' : 'success';
          this.mostrarToast(res.mensaje || 'Sucursal procesada con éxito.', color);
          this.cargarSucursales();
        } else {
          this.mostrarToast(res.mensaje || 'Error al eliminar sucursal.', 'danger');
        }
      },
      error: () => this.mostrarToast('Error de comunicación con el servidor.', 'danger')
    });
  }

  async logout() {
    await this.authService.logout();
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
