import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonBadge, IonButton, IonIcon, 
  IonSkeletonText, IonButtons, IonMenuButton, IonSearchbar, IonSelect, 
  IonSelectOption, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, 
  IonCardContent, IonChip, IonToggle, 
  IonRefresher, IonRefresherContent, ModalController, ToastController, AlertController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  businessOutline, addCircleOutline, searchOutline, filterOutline, 
  gridOutline, listOutline, createOutline, trashOutline, powerOutline, 
  logOutOutline, refreshOutline, checkmarkCircleOutline, closeCircleOutline, 
  locationOutline, sparklesOutline
} from 'ionicons/icons';

import { SucursalesService, Sucursal, FiltrosSucursal } from '../../core/services/sucursales.service';
import { ModalSucursalComponent } from '../../shared/components/modal-sucursal/modal-sucursal.component';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-sucursales',
  templateUrl: './sucursales.page.html',
  styleUrls: ['./sucursales.page.scss'],
  standalone: true,
  imports: [
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
      locationOutline, sparklesOutline
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
        this.cdr.markForCheck();
      }
    });
  }

  recalcularKPIs(lista: Sucursal[]) {
    this.kpiTotal = lista.length;
    this.kpiActivas = lista.filter(s => s.activo).length;
    this.kpiInactivas = lista.filter(s => !s.activo).length;
  }

  onSearchChange(event: any) {
    this.filtros.busqueda = event.detail.value || '';
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
    const { data } = await modal.onWillDismiss();
    if (data === true) {
      this.cargarSucursales();
    }
  }

  async abrirModalEditarSucursal(sucursal: Sucursal) {
    const modal = await this.modalCtrl.create({
      component: ModalSucursalComponent,
      componentProps: {
        sucursalActual: sucursal
      }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data === true) {
      this.cargarSucursales();
    }
  }

  async confirmarCambioEstado(sucursal: Sucursal, event: any) {
    event.stopPropagation();
    const nuevoEstado = !sucursal.activo;
    const accionText = nuevoEstado ? 'activar' : 'desactivar';

    const alert = await this.alertCtrl.create({
      header: `¿${nuevoEstado ? 'Activar' : 'Desactivar'} Sucursal?`,
      message: `¿Estás seguro de que deseas ${accionText} la sucursal "${sucursal.nombre}" (${sucursal.id_sucursal})?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: nuevoEstado ? 'Activar' : 'Desactivar',
          role: 'confirm',
          handler: () => {
            this.sucursalesService.cambiarEstadoSucursal(sucursal.id_sucursal, nuevoEstado).subscribe({
              next: (res) => {
                if (res.exito !== false) {
                  this.mostrarToast(`Sucursal ${nuevoEstado ? 'activada' : 'desactivada'} con éxito.`, 'success');
                  this.cargarSucursales();
                } else {
                  this.mostrarToast(res.mensaje || 'No se pudo cambiar el estado.', 'danger');
                }
              },
              error: () => this.mostrarToast('Error al actualizar el estado de la sucursal.', 'danger')
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmarEliminacion(sucursal: Sucursal, event?: any) {
    if (event) event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Deseas borrar los datos de la sucursal "${sucursal.nombre}" (${sucursal.id_sucursal})?\n\nSi la sucursal cuenta con operadores o registros asociados, el sistema la desactivará para resguardar el historial.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.sucursalesService.eliminarSucursal(sucursal.id_sucursal).subscribe({
              next: (res) => {
                if (res.exito !== false) {
                  this.mostrarToast(res.mensaje || 'Sucursal procesada con éxito.', 'success');
                  this.cargarSucursales();
                } else {
                  this.mostrarToast(res.mensaje || 'Error al eliminar la sucursal.', 'danger');
                }
              },
              error: () => this.mostrarToast('Error de comunicación con el servidor.', 'danger')
            });
          }
        }
      ]
    });

    await alert.present();
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
