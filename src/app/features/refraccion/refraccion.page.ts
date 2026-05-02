import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController, IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-refraccion',
  templateUrl: './refraccion.page.html',
  styleUrls: ['./refraccion.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RefraccionPage implements OnInit {
/* yo estaba usando una api local para poder hacer pruebas */
  API = 'http://localhost:3000/api';

  textoBusquedaCliente = '';
  clientesFiltrados: any[] = [];

  clienteSeleccionado: any = null;
  idCliente: number | null = null;

  mostrarFormNuevoCliente = false;
  nuevoCliente: any = { nombre_completo: '', telefono: '' };

  historialOriginal: any[] = [];
  historialFiltrado: any[] = [];
  textoBusqueda = '';

  doctores: any[] = [];
  doctoresFiltrados: any[] = [];
  mostrarListaDoctores = false;

  nuevaRx: any = {
    doctor: '',
    cedula: '',
    observaciones: '',
    od: { esfera: null, cilindro: null, eje: null, adicion: null },
    oi: { esfera: null, cilindro: null, eje: null, adicion: null }
  };

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.cargarClientes();
    this.cargarDoctores();
  }

  cargarClientes() {
    this.http.get(`${this.API}/clientes/buscar?q=`)
      .subscribe((data: any) => {
        this.clientesFiltrados = data;
      });
  }

  buscarCliente() {
    this.http.get(`${this.API}/clientes/buscar?q=${this.textoBusquedaCliente}`)
      .subscribe((data: any) => {
        this.clientesFiltrados = data;
      });
  }

  seleccionarCliente(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.idCliente = cliente.id_cliente;
    this.clientesFiltrados = [];
    this.cargarHistorial();
  }

  limpiarCliente() {
    this.clienteSeleccionado = null;
    this.idCliente = null;
    this.textoBusquedaCliente = '';
    this.cargarClientes();
    this.historialOriginal = [];
    this.historialFiltrado = [];
    this.resetForm();
  }

  toggleNuevoCliente() {
    this.mostrarFormNuevoCliente = !this.mostrarFormNuevoCliente;
    this.nuevoCliente.nombre_completo = this.textoBusquedaCliente;
  }

  guardarNuevoCliente() {
    this.http.post(`${this.API}/clientes`, this.nuevoCliente)
      .subscribe((res: any) => {

        const cliente = {
          id_cliente: res.id_cliente,
          nombre_completo: this.nuevoCliente.nombre_completo
        };

        this.seleccionarCliente(cliente);
        this.mostrarFormNuevoCliente = false;
        this.nuevoCliente = { nombre_completo: '', telefono: '' };

        this.mostrarToast('Cliente agregado', 'success');
      });
  }

  cargarHistorial() {
    if (!this.idCliente) return;

    this.http.get(`${this.API}/historial/${this.idCliente}`)
      .subscribe((data: any) => {
        this.historialOriginal = data;
        this.historialFiltrado = data;
      });
  }

  filtrarHistorial() {
    const texto = this.textoBusqueda.toLowerCase();

    this.historialFiltrado = this.historialOriginal.filter((r: any) =>
      (r.doctor || '').toLowerCase().includes(texto) ||
      (r.folio || '').toLowerCase().includes(texto)
    );
  }

  cargarDoctores() {
    this.http.get(`${this.API}/doctores`)
      .subscribe((data: any) => {
        this.doctores = data;
      });
  }

  mostrarTodosDoctores() {
    this.mostrarListaDoctores = true;
    this.doctoresFiltrados = this.doctores;
  }

  buscarDoctor() {
    const texto = this.nuevaRx.doctor.toLowerCase();

    this.mostrarListaDoctores = true;

    this.doctoresFiltrados = this.doctores.filter((d: any) =>
      d.nombre.toLowerCase().includes(texto)
    );
  }

  buscarCedula() {
    const texto = this.nuevaRx.cedula;

    this.doctoresFiltrados = this.doctores.filter((d: any) =>
      d.cedula.includes(texto)
    );
  }

  seleccionarDoctor(doc: any) {
    this.nuevaRx.doctor = doc.nombre;
    this.nuevaRx.cedula = doc.cedula;
    this.mostrarListaDoctores = false;
  }

  guardarExamen() {
    if (!this.idCliente) {
      this.mostrarToast('Selecciona un cliente', 'warning');
      return;
    }

    const payload = {
      id_cliente: this.idCliente,
      doctor: this.nuevaRx.doctor,
      cedula: this.nuevaRx.cedula,
      observaciones: this.nuevaRx.observaciones,
      od: this.nuevaRx.od,
      oi: this.nuevaRx.oi
    };

    this.http.post(`${this.API}/guardar-rx`, payload)
      .subscribe(() => {
        this.mostrarToast('RX guardada', 'success');
        this.resetForm();
        this.cargarHistorial();
      });
  }

  resetForm() {
    this.nuevaRx = {
      doctor: '',
      cedula: '',
      observaciones: '',
      od: { esfera: null, cilindro: null, eje: null, adicion: null },
      oi: { esfera: null, cilindro: null, eje: null, adicion: null }
    };
  }

  async mostrarToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }

}
