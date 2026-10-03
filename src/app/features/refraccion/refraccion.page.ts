import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-refraccion',
  templateUrl: './refraccion.page.html',
  styleUrls: ['./refraccion.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RefraccionPage implements OnInit {
  clienteSeleccionado: any = null;
  textoBusquedaCliente = '';
  clientesFiltrados: any[] = [];

  // Objeto temporal para capturar una refacción rápida
  refaccionTemp = {
    nombre: '',
    precio: null as number | null
  };

  // Objeto principal de la orden de reparación
  reparacion = {
    armazon: '',
    descripcion_falla: '',
    mano_obra: 0,
    items: [] as Array<{ nombre: string; precio: number }>
  };

  totalCalculado = 0;
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  buscarCliente() {
    const query = this.textoBusquedaCliente.trim();
    if (!query) {
      this.clientesFiltrados = [];
      return;
    }

    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(`${this.apiUrl}/clientes/buscar`, {
      headers,
      params: { q: query, busqueda: query, termino: query }
    }).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.clientesFiltrados = res;
        } else if (res && Array.isArray(res.data)) {
          this.clientesFiltrados = res.data;
        } else if (res && Array.isArray(res.clientes)) {
          this.clientesFiltrados = res.clientes;
        } else {
          this.clientesFiltrados = [];
        }
      },
      error: (err) => {
        console.error('Error al buscar clientes:', err);
        this.clientesFiltrados = [];
      }
    });
  }

  seleccionarCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.clientesFiltrados = [];
  }

  limpiarCliente() {
    this.clienteSeleccionado = null;
  }

  // --- LÓGICA DE REFACCIONES Y MANO DE OBRA ---
  agregarRefaccion() {
    if (!this.refaccionTemp.nombre.trim() || !this.refaccionTemp.precio) return;

    this.reparacion.items.push({
      nombre: this.refaccionTemp.nombre,
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
    const totalRefacciones = this.reparacion.items.reduce((acc, item) => acc + item.precio, 0);
    const manoObra = Number(this.reparacion.mano_obra) || 0;
    this.totalCalculado = totalRefacciones + manoObra;
  }

  guardarReparacion() {
    if (!this.clienteSeleccionado) {
      alert('Por favor, busque y seleccione un cliente primero.');
      return;
    }

    if (this.totalCalculado <= 0) {
      alert('Agregue al menos una refacción o un costo de mano de obra.');
      return;
    }

    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    const detallesOrden = [
      ...this.reparacion.items.map(item => ({
        concepto: `[REFACCIÓN] ${item.nombre}`,
        cantidad: 1,
        precio_unitario: item.precio,
        subtotal: item.precio
      }))
    ];

    if (this.reparacion.mano_obra > 0) {
      detallesOrden.push({
        concepto: `[MANO DE OBRA] Servicio - Armazón: ${this.reparacion.armazon || 'Genérico'}`,
        cantidad: 1,
        precio_unitario: Number(this.reparacion.mano_obra),
        subtotal: Number(this.reparacion.mano_obra)
      });
    }

    const payload = {
      id_cliente: this.clienteSeleccionado.id_cliente,
      email_cliente: this.clienteSeleccionado.correo || this.clienteSeleccionado.email || null,
      armazon: this.reparacion.armazon,
      observaciones: `Falla: ${this.reparacion.descripcion_falla || 'Sin detalles'}`,
      mano_obra: this.reparacion.mano_obra,
      total: this.totalCalculado,
      detalles: detallesOrden
    };

    this.http.post<any>(`${this.apiUrl}/ordenes/reparacion`, payload, { headers }).subscribe({
      next: (res) => {
        const id = res.id_reparacion;
        alert(`¡Orden de Reparación #${id} registrada correctamente!`);

        if (id) {
          this.descargarPdfConToken(id, token);
        }

        this.limpiarFormulario();
      },
      error: (err) => {
        console.error('Error al guardar reparación:', err);
        alert('Error en el servidor al guardar la orden.');
      }
    });
  }

  // Método para obtener el archivo binario del PDF autenticado con el Token
  descargarPdfConToken(id: number, token: string) {
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get(`${this.apiUrl}/ordenes/reparacion/${id}/pdf`, {
      headers,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      },
      error: (err) => {
        console.error('Error al descargar el PDF:', err);
        alert('No se pudo abrir el PDF de la orden.');
      }
    });
  }

  limpiarFormulario() {
    this.clienteSeleccionado = null;
    this.textoBusquedaCliente = '';
    this.clientesFiltrados = [];
    this.refaccionTemp = { nombre: '', precio: null };
    this.reparacion = { armazon: '', descripcion_falla: '', mano_obra: 0, items: [] };
    this.totalCalculado = 0;
  }
}