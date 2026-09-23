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
  personAddOutline, searchOutline, filterOutline, gridOutline, 
  listOutline, keyOutline, createOutline, powerOutline, peopleOutline, 
  businessOutline, shieldCheckmarkOutline, eyeOutline, cashOutline, 
  logOutOutline, refreshOutline, personCircle, checkmarkCircleOutline, 
  closeCircleOutline, sparklesOutline, cubeOutline
} from 'ionicons/icons';

import { OperadoresService, Operador, FiltrosOperador, CatalogosOperador } from '../../core/services/operadores.service';
import { ModalOperadorComponent } from '../../shared/components/modal-operador/modal-operador.component';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-operadores',
  templateUrl: './operadores.page.html',
  styleUrls: ['./operadores.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonBadge, IonButton, IonIcon, 
    IonSkeletonText, IonButtons, IonMenuButton, IonSearchbar, IonSelect, 
    IonSelectOption, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, 
    IonCardContent, IonChip, IonToggle, 
    IonRefresher, IonRefresherContent
  ]
})
export class OperadoresPage implements OnInit {
  private operadoresService = inject(OperadoresService);
  private authService = inject(AuthService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);

  // Estados Reactivos
  public cargando = signal<boolean>(true);
  public operadores = signal<Operador[]>([]);
  public vistaModo: 'CARDS' | 'TABLE' = 'CARDS';

  // Catálogos y Filtros
  public catalogos: CatalogosOperador = { roles: [], sucursales: [] };
  public filtros: FiltrosOperador = {
    activo: 'all',
    id_sucursal: 'all',
    rol: 'all',
    busqueda: ''
  };

  // KPIs Calculados
  public kpiTotal = 0;
  public kpiActivos = 0;
  public kpiInactivos = 0;
  public kpiOptometristas = 0;
  public kpiMostrador = 0;

  constructor() {
    addIcons({
      personAddOutline, searchOutline, filterOutline, gridOutline, 
      listOutline, keyOutline, createOutline, powerOutline, peopleOutline, 
      businessOutline, shieldCheckmarkOutline, eyeOutline, cashOutline, 
      logOutOutline, refreshOutline, personCircle, checkmarkCircleOutline, 
      closeCircleOutline, sparklesOutline, cubeOutline
    });
  }

  ngOnInit() {
    this.cargarCatalogos();
    this.cargarOperadores();
  }

  cargarCatalogos() {
    this.operadoresService.obtenerCatalogos().subscribe({
      next: (cat) => {
        this.catalogos = cat;
        this.cdr.markForCheck();
      }
    });
  }

  cargarOperadores(event?: any) {
    this.cargando.set(true);

    this.operadoresService.obtenerOperadores(this.filtros).subscribe({
      next: (data) => {
        this.operadores.set(data);
        this.recalcularKPIs(data);
        this.cargando.set(false);
        if (event) event.target.complete();
        this.cdr.markForCheck();
      },
      error: async (err) => {
        this.cargando.set(false);
        if (event) event.target.complete();
        const toast = await this.toastCtrl.create({
          message: 'Error al consultar lista de operadores.',
          duration: 3000, 
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  recalcularKPIs(data: Operador[]) {
    this.kpiTotal = data.length;
    this.kpiActivos = data.filter(o => o.activo).length;
    this.kpiInactivos = data.filter(o => !o.activo).length;
    this.kpiOptometristas = data.filter(o => o.roles?.includes('OPTOMETRISTA')).length;
    this.kpiMostrador = data.filter(o => o.roles?.includes('MOSTRADOR')).length;
  }

  onSearchChange(event: any) {
    this.filtros.busqueda = event.detail.value || '';
    this.cargarOperadores();
  }

  onFiltroChange() {
    this.cargarOperadores();
  }

  limpiarFiltros() {
    this.filtros = {
      activo: 'all',
      id_sucursal: 'all',
      rol: 'all',
      busqueda: ''
    };
    this.cargarOperadores();
  }

  async abrirModalNuevoOperador() {
    const modal = await this.modalCtrl.create({ 
      component: ModalOperadorComponent,
      componentProps: { catalogos: this.catalogos }
    });
    
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.cargarOperadores();
    }
  }

  async editarOperador(operador: Operador) {
    const modal = await this.modalCtrl.create({ 
      component: ModalOperadorComponent, 
      componentProps: { 
        operadorActual: operador,
        catalogos: this.catalogos 
      }
    });
    
    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      this.cargarOperadores();
    }
  }

  async cambiarEstado(operador: Operador, nuevoEstado: boolean) {
    const actionText = nuevoEstado ? 'activar' : 'desactivar';
    const alert = await this.alertCtrl.create({
      header: `¿Confirmar ${actionText}?`,
      message: `¿Estás seguro de que deseas ${actionText} a ${operador.nombre_completo}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.operadoresService.cambiarEstadoOperador(operador.id_operador!, nuevoEstado).subscribe({
              next: async (res) => {
                const toast = await this.toastCtrl.create({
                  message: res.mensaje || `Operador ${actionText}do correctamente.`,
                  duration: 2500,
                  color: nuevoEstado ? 'success' : 'warning'
                });
                await toast.present();
                this.cargarOperadores();
              },
              error: async () => {
                const toast = await this.toastCtrl.create({
                  message: 'Error al cambiar estatus.',
                  duration: 2500,
                  color: 'danger'
                });
                await toast.present();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async cambiarPasswordModal(operador: Operador) {
    const alert = await this.alertCtrl.create({
      header: `Cambiar Contraseña`,
      subHeader: `Operador: ${operador.nombre_completo}`,
      inputs: [
        {
          name: 'nuevaPassword',
          type: 'password',
          placeholder: 'Ingresa nueva contraseña (mínimo 6 caracteres)'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar Contraseña',
          handler: (data) => {
            if (!data.nuevaPassword || data.nuevaPassword.trim().length < 6) {
              this.mostrarToast('La contraseña debe tener al menos 6 caracteres', 'warning');
              return false;
            }
            this.operadoresService.cambiarPassword(operador.id_operador!, data.nuevaPassword.trim()).subscribe({
              next: () => this.mostrarToast('Contraseña actualizada con éxito', 'success'),
              error: () => this.mostrarToast('Error al actualizar contraseña', 'danger')
            });
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private async mostrarToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 2500, color: color as any });
    await toast.present();
  }

  getBadgeColorForRol(rol: string): string {
    switch (rol) {
      case 'ADMINISTRADOR': return 'tertiary';
      case 'MOSTRADOR': return 'primary';
      case 'CAJER@': return 'success';
      case 'OPTOMETRISTA': return 'warning';
      case 'INVENTARIO': return 'secondary';
      case 'FACTURADOR@': return 'dark';
      default: return 'medium';
    }
  }

  async logout() {
    await this.authService.logout();
  }
}