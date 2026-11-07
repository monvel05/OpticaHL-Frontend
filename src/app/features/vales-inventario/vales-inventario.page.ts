import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, 
  IonCol, IonInput, IonButton, IonCard, IonItem, IonLabel, 
  IonTextarea, ToastController 
} from '@ionic/angular/standalone';
import { ProveedoresService } from '../../core/services/proveedores.service';

interface DetalleVale {
  codigo: string;
  descripcion: string;
  cantidad: number;
}

@Component({
  selector: 'app-vales-inventario',
  templateUrl: './vales-inventario.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonGrid, IonRow, IonCol, IonInput, IonButton, 
    IonCard, IonItem, IonLabel, IonTextarea
  ]
})
export class ValesInventarioPage implements OnInit {
  tipoVale: 'ENTRADA' | 'SALIDA' = 'ENTRADA';
  
  vale = {
    cve: '',
    proveedor: '',
    folio: '1157',
    fecha: new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    observaciones: ''
  };

  codigoBusqueda: string = '';
  detalles: DetalleVale[] = [];
  detalleSeleccionadoIndex: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private provService: ProveedoresService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tipo']) {
        this.tipoVale = params['tipo'] === 'SALIDA' ? 'SALIDA' : 'ENTRADA';
        this.vale.observaciones = `${this.tipoVale} DE ARMAZON`;
      }
      if (params['id_proveedor']) {
        this.vale.cve = params['id_proveedor'];
        this.vale.proveedor = params['nombre_proveedor'] || '';
      }
    });
  }

  agregarMaterial() {
    if (!this.codigoBusqueda.trim()) {
      this.mostrarToast('Ingresa un código de artículo', 'warning');
      return;
    }

    this.detalles.push({
      codigo: this.codigoBusqueda.toUpperCase(),
      descripcion: 'ARMAZON DE MUESTRA',
      cantidad: 1
    });

    this.codigoBusqueda = '';
  }

  eliminarDetalle() {
    if (this.detalleSeleccionadoIndex !== null) {
      this.detalles.splice(this.detalleSeleccionadoIndex, 1);
      this.detalleSeleccionadoIndex = null;
    }
  }

  guardarVale() {
    if (this.detalles.length === 0) {
      this.mostrarToast('Debes agregar al menos un ítem al vale', 'warning');
      return;
    }

    const payload = {
      vale: {
        id_proveedor: Number(this.vale.cve) || 1,
        tipo_movimiento: this.tipoVale,
        folio: this.vale.folio,
        observaciones: this.vale.observaciones
      },
      detalles: this.detalles
    };

    this.provService.guardarVale(payload.vale, payload.detalles).subscribe({
      next: () => {
        this.mostrarToast(`VALE DE ${this.tipoVale} guardado con éxito`, 'success');
        this.router.navigate(['/proveedores']);
      },
      error: () => this.mostrarToast('Error al registrar el vale', 'danger')
    });
  }

  cancelar() {
    this.router.navigate(['/proveedores']);
  }

  async mostrarToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color });
    toast.present();
  }
}