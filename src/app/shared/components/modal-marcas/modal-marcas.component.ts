import { Component, OnInit, Input, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
  IonContent, IonSearchbar, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonBadge, IonInput,
  IonSelect, IonSelectOption, IonTextarea, IonSpinner, ModalController,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, addOutline, searchOutline, pricetagOutline,
  businessOutline, createOutline, trashOutline, checkmarkCircleOutline,
  cubeOutline, refreshOutline
} from 'ionicons/icons';
import { MarcaService, Marca } from 'src/app/core/services/marca.service';
import { ProveedoresService, Proveedor } from 'src/app/core/services/proveedores.service';

@Component({
  selector: 'app-modal-marcas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonSearchbar, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonBadge, IonInput,
    IonSelect, IonSelectOption, IonTextarea, IonSpinner
  ],
  templateUrl: './modal-marcas.component.html',
  styleUrls: ['./modal-marcas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalMarcasComponent implements OnInit {
  @Input() modoSeleccion: boolean = false;

  private modalCtrl = inject(ModalController);
  private marcaService = inject(MarcaService);
  private proveedoresService = inject(ProveedoresService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  public marcas: Marca[] = [];
  public proveedores: Proveedor[] = [];
  public cargando: boolean = false;
  public busqueda: string = '';
  public mostrandoFormulario: boolean = false;

  // Formulario de Marca (creación/edición)
  public marcaEditando: Marca | null = null;
  public formMarca = {
    nombre: '',
    id_proveedor: null as number | null,
    descripcion: ''
  };

  constructor() {
    addIcons({
      closeOutline, addOutline, searchOutline, pricetagOutline,
      businessOutline, createOutline, trashOutline, checkmarkCircleOutline,
      cubeOutline, refreshOutline
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.cdr.markForCheck();

    // Cargar proveedores para el selector
    this.proveedoresService.getProveedores().subscribe({
      next: (provs) => {
        this.proveedores = provs || [];
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    // Cargar marcas
    this.marcaService.obtenerMarcas({ busqueda: this.busqueda, activo: 'true' }).subscribe({
      next: (marcas) => {
        this.marcas = marcas || [];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.mostrarToast('Error al consultar marcas', 'danger');
        this.cdr.markForCheck();
      }
    });
  }

  onBuscarChange() {
    this.cargarDatos();
  }

  abrirCrear() {
    this.marcaEditando = null;
    this.formMarca = {
      nombre: '',
      id_proveedor: this.proveedores.length > 0 ? (this.proveedores[0].id_proveedor || null) : null,
      descripcion: ''
    };
    this.mostrandoFormulario = true;
    this.cdr.markForCheck();
  }

  abrirEditar(m: Marca) {
    this.marcaEditando = m;
    this.formMarca = {
      nombre: m.nombre,
      id_proveedor: m.id_proveedor || null,
      descripcion: m.descripcion || ''
    };
    this.mostrandoFormulario = true;
    this.cdr.markForCheck();
  }

  cancelarFormulario() {
    this.mostrandoFormulario = false;
    this.marcaEditando = null;
    this.cdr.markForCheck();
  }

  seleccionar(m: Marca) {
    this.modalCtrl.dismiss({ marca: m }, 'confirm');
  }

  guardarMarca() {
    if (!this.formMarca.nombre || !this.formMarca.nombre.trim()) {
      this.mostrarToast('El nombre de la marca es obligatorio.', 'warning');
      return;
    }

    if (this.marcaEditando) {
      // Actualizar
      this.marcaService.actualizarMarca(this.marcaEditando.id_marca, {
        nombre: this.formMarca.nombre.trim(),
        id_proveedor: this.formMarca.id_proveedor,
        descripcion: this.formMarca.descripcion
      }).subscribe({
        next: (resp) => {
          this.mostrarToast('Marca actualizada correctamente.', 'success');
          this.mostrandoFormulario = false;
          this.marcaEditando = null;
          this.cargarDatos();
        },
        error: (err) => this.mostrarToast(err.error?.message || 'Error al actualizar marca.', 'danger')
      });
    } else {
      // Crear nueva
      this.marcaService.crearMarca({
        nombre: this.formMarca.nombre.trim(),
        id_proveedor: this.formMarca.id_proveedor,
        descripcion: this.formMarca.descripcion
      }).subscribe({
        next: (resp) => {
          this.mostrarToast(resp.message || 'Marca creada correctamente.', 'success');
          if (this.modoSeleccion && resp.datos) {
            this.modalCtrl.dismiss({ marca: resp.datos }, 'confirm');
          } else {
            this.mostrandoFormulario = false;
            this.cargarDatos();
          }
        },
        error: (err) => this.mostrarToast(err.error?.message || 'Error al crear marca.', 'danger')
      });
    }
  }

  async confirmarEliminar(m: Marca) {
    const alert = await this.alertCtrl.create({
      header: 'Desactivar Marca',
      message: `¿Estás seguro de desactivar la marca "${m.nombre}"? Los artículos existentes conservarán el nombre, pero no aparecerá en nuevas creaciones.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desactivar',
          role: 'destructive',
          handler: () => {
            this.marcaService.eliminarMarca(m.id_marca).subscribe({
              next: () => {
                this.mostrarToast('Marca desactivada.', 'success');
                this.cargarDatos();
              },
              error: () => this.mostrarToast('Error al desactivar marca.', 'danger')
            });
          }
        }
      ]
    });

    await alert.present();
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
