import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { personCircleOutline, addOutline, trashOutline, buildOutline } from 'ionicons/icons';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, 
  IonSearchbar, IonButton, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonItem, IonLabel, IonInput, IonList, IonIcon, 
  IonTextarea, ToastController 
} from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';

interface ItemRefaccion {
  nombre: string;
  precio: number;
}

interface Cliente {
  id_cliente: number;
  nombre_completo: string;
  telefono?: string;
}

@Component({
  selector: 'app-refraccion',
  templateUrl: './refraccion.page.html',
  styleUrls: ['./refraccion.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,
    IonSearchbar, IonButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonList, IonIcon,
    IonTextarea
  ]
})
export class RefraccionPage implements OnInit {
  API = environment.apiUrl;

  // --- BÚSQUEDA Y CLIENTES ---
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  textoBusquedaCliente: string = '';
  clienteSeleccionado: Cliente | null = null;

  // --- ESTRUCTURA DE LA REPARACIÓN ---
  reparacion = {
    armazon: '',
    descripcion_falla: '',
    mano_obra: 0,
    items: [] as ItemRefaccion[]
  };

  // --- CAMPO TEMPORAL PARA AGREGAR REFACCIÓN ---
  refaccionTemp = {
    nombre: '',
    precio: null as number | null
  };

  totalCalculado: number = 0;

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {
    addIcons({
      'person-circle-outline': personCircleOutline,
      'add-outline': addOutline,
      'trash-outline': trashOutline,
      'build-outline': buildOutline
    });
  }

  ngOnInit() {
    this.cargarClientes();
  }

  // --- MÉTODOS DE CLIENTE ---
  cargarClientes() {
    this.http.get<Cliente[]>(`${this.API}/clientes`).subscribe({
      next: (res) => {
        this.clientes = res;
      },
      error: () => this.mostrarToast('Error al cargar la lista de clientes', 'danger')
    });
  }

  buscarCliente() {
    const query = this.textoBusquedaCliente.trim().toLowerCase();
    if (!query) {
      this.clientesFiltrados = [];
      return;
    }
    this.clientesFiltrados = this.clientes.filter(c => 
      c.nombre_completo.toLowerCase().includes(query) || 
      (c.telefono && c.telefono.includes(query))
    );
  }

  seleccionarCliente(cliente: Cliente) {
    this.clienteSeleccionado = cliente;
    this.clientesFiltrados = [];
    this.textoBusquedaCliente = '';
  }

  limpiarCliente() {
    this.clienteSeleccionado = null;
  }

  // --- MÉTODOS DE REFACCIONES Y TALLER ---
  agregarRefaccion() {
    if (!this.refaccionTemp.nombre.trim() || this.refaccionTemp.precio === null || this.refaccionTemp.precio <= 0) {
      this.mostrarToast('Ingresa una descripción y un precio válido', 'warning');
      return;
    }

    this.reparacion.items.push({
      nombre: this.refaccionTemp.nombre.trim(),
      precio: Number(this.refaccionTemp.precio)
    });

    this.refaccionTemp = { nombre: '', precio: null };
    this.calcularTotal();
  }

  eliminarRefaccion(index: number) {
    this.reparacion.items.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    const totalRefacciones = this.reparacion.items.reduce(
      (acc, item) => acc + (Number(item.precio) || 0), 0
    );
    const manoObra = Number(this.reparacion.mano_obra) || 0;

    this.totalCalculado = totalRefacciones + manoObra;
  }

  guardarReparacion() {
    if (!this.clienteSeleccionado) {
      this.mostrarToast('Selecciona un cliente antes de guardar', 'warning');
      return;
    }

    if (!this.reparacion.armazon.trim() || !this.reparacion.descripcion_falla.trim()) {
      this.mostrarToast('Ingresa la información del armazón y el motivo de reparación', 'warning');
      return;
    }

    const payload = {
      id_cliente: this.clienteSeleccionado.id_cliente,
      armazon: this.reparacion.armazon,
      descripcion_falla: this.reparacion.descripcion_falla,
      mano_obra: this.reparacion.mano_obra,
      items: this.reparacion.items,
      total: this.totalCalculado
    };

    this.http.post(`${this.API}/reparaciones`, payload).subscribe({
      next: () => {
        this.mostrarToast('Orden de reparación guardada con éxito', 'success');
        this.resetFormulario();
      },
      error: () => this.mostrarToast('Error al guardar la orden de reparación', 'danger')
    });
  }

  resetFormulario() {
    this.clienteSeleccionado = null;
    this.reparacion = {
      armazon: '',
      descripcion_falla: '',
      mano_obra: 0,
      items: []
    };
    this.refaccionTemp = { nombre: '', precio: null };
    this.totalCalculado = 0;
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}