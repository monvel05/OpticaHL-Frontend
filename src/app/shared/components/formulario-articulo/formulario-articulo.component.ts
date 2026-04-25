import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { SelectorEntidadComponent } from '../selector-entidad/selector-entidad.component';

//IMPORTACIONES NECESARIAS (Servicio e Iconos)
import { InventarioService } from 'src/app/core/services/inventario.service';
import { addIcons } from 'ionicons';
import { 
  barcodeOutline, 
  glassesOutline, 
  cashOutline, 
  documentTextOutline, 
  closeOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-formulario-articulo',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SelectorEntidadComponent],
  templateUrl: './formulario-articulo.component.html',
  styleUrls: ['./formulario-articulo.component.scss'],
})
export class FormularioArticuloComponent implements OnInit {
  @Input() tipoArticulo: string = ''; 

  // Modelo del objeto (Agregué el campo codigo para que el binding funcione)
  articulo: any = {
    codigo: '',
    nombre: '',
    marcaId: null,
    marcaNombre: '',
    precio: 0,
    cantidad: 0,
    stockMinimo: 5,
    descripcion: ''
  };

  // INYECCIÓN DEL SERVICIO EN EL CONSTRUCTOR
  constructor(
    private modalCtrl: ModalController,
    private inventarioService: InventarioService
  ) {
    // Registramos los iconos para que se vean en el HTML
    addIcons({ 
      barcodeOutline, 
      glassesOutline, 
      cashOutline, 
      documentTextOutline, 
      closeOutline 
    });
  }

  ngOnInit() {
    console.log('Abriendo formulario para:', this.tipoArticulo);
  }

  onMarcaSelected(marca: any) {
    this.articulo.marcaId = marca.id;
    this.articulo.marcaNombre = marca.nombre; // Guardamos el nombre para el detalle
  }

  cerrar() {
    this.modalCtrl.dismiss(); 
  }

  // LÓGICA DE GUARDADO CORREGIDA
  guardar() {
    // Construimos el Payload exacto que pide el controlador de Node.js
    const articuloParaEnviar = {
      // Datos para ARTICULOS
      codigo: this.articulo.codigo || 'ART-' + Date.now(),
      nombre: this.articulo.nombre,
      categoria: this.obtenerCategoriaDB(),
      id_proveedor: 1, 
      costo: 0, 
      precio_venta: this.articulo.precio,
      creado_por: 1, 

      // Datos para ARTICULO_DETALLE
      marca: this.articulo.marcaNombre || 'N/A',
      color: 'N/A',
      material: 'N/A',
      estilo: 'N/A',
      puente: 0,
      diagonal: 0,
      base: 'N/A',

      // Datos para INVENTARIO_SUCURSAL
      id_sucursal: 'HL01', 
      stock_inicial: this.articulo.cantidad,
      stock_minimo: this.articulo.stockMinimo,
      ubicacion: 'Mostrador' 
    };

    console.log('Enviando al backend:', articuloParaEnviar);

    // Llamada al servicio con suscripción correcta
    this.inventarioService.crearProducto(articuloParaEnviar).subscribe({
      next: (response) => {
        console.log('Éxito:', response.message);
        // Cerramos el modal y avisamos que hubo un cambio exitoso
        this.modalCtrl.dismiss(articuloParaEnviar, 'confirm');
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        // Aquí podrías mostrar una alerta al usuario
      }
    });
  }

  obtenerCategoriaDB() {
    // Convertimos el tipo que viene del modal al ENUM de la base de datos
    switch(this.tipoArticulo.toLowerCase()) {
      case 'armazones': return 'ARMAZON';
      case 'lentes': return 'LENTE_CONTACTO';
      case 'accesorios': return 'ACCESORIO';
      default: return 'ARMAZON';
    }
  }
}