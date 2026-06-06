import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { SelectorEntidadComponent } from '../selector-entidad/selector-entidad.component';

// IMPORTACIONES NECESARIAS (Servicio e Iconos)
import { InventarioService } from 'src/app/core/services/inventario.service';
import { addIcons } from 'ionicons';
import { 
  barcodeOutline, 
  glassesOutline, 
  cashOutline, 
  documentTextOutline, 
  closeOutline,
  layersOutline,
  colorPaletteOutline, 
  shapesOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-formulario-articulo',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SelectorEntidadComponent],
  templateUrl: './formulario-articulo.component.html',
  styleUrls: ['./formulario-articulo.component.scss'],
})
export class FormularioArticuloComponent implements OnInit {
  // Recibe la inicial ('Z', 'S', 'A', 'SERVICIO') directo desde el inventario principal
  @Input() tipoArticulo: string = 'Z'; 

  private modalCtrl = inject(ModalController);
  private inventarioService = inject(InventarioService);

  // Título dinámico estandarizado para la interfaz de usuario
  tituloVista: string = '';

  // Modelo ampliado con los campos obligatorios del Checklist de la Semana 8
  articulo: any = {
    codigo: '',
    nombre: '',
    marcaId: null,
    marcaNombre: '',
    precio: 0,
    costo: 0, // Añadido para control financiero básico
    cantidad: 0,
    stockMinimo: 5,
    // Detalles físicos requeridos para armazones y lentes
    material: '',
    color: '',
    forma: '',
    descripcion: ''
  };

  // Lista de marcas declarada en el TS para alimentar al HTML
  marcasDisponibles: any[] = [
    { id: 1, nombre: 'Ray-Ban' },
    { id: 2, nombre: 'Oakley' },
    { id: 3, nombre: 'Vogue' },
    { id: 4, nombre: 'Prada' },
    { id: 5, nombre: 'Carrera' },
    { id: 6, nombre: 'Genérica / Económica' }
  ];

  constructor() {
    // Registramos todos los iconos necesarios para los nuevos campos
    addIcons({ 
      barcodeOutline, 
      glassesOutline, 
      cashOutline, 
      documentTextOutline, 
      closeOutline,
      layersOutline,
      'color-palette-outline': colorPaletteOutline, // Registrado de forma segura mapeando el string del HTML
      shapesOutline
    });
  }

  ngOnInit() {
    console.log('Abriendo formulario para código de categoría:', this.tipoArticulo);
    this.definirTituloYValores();
  }

  /**
   * Traduce la inicial interna de la BD a un texto legible para el título del usuario
   */
  definirTituloYValores() {
    switch(this.tipoArticulo) {
      case 'Z': 
        this.tituloVista = 'Armazón'; 
        break;
      case 'S': 
        this.tituloVista = 'Mica / Cristal'; 
        break;
      case 'A': 
        this.tituloVista = 'Accesorio'; 
        break;
      case 'SERVICIO': // <-- JUAN: Agregado para soportar el catálogo intangible
        this.tituloVista = 'Servicio'; 
        break;
      default: 
        this.tituloVista = 'Artículo';
    }
  }

  onMarcaSelected(marca: any) {
    this.articulo.marcaId = marca.id;
    this.articulo.marcaNombre = marca.nombre;
  }

  cerrar() {
    this.modalCtrl.dismiss(); 
  }

  guardar() {
    // Determinar si el artículo actual corresponde a un servicio intangible
    const esServicio = this.tipoArticulo === 'SERVICIO';

    // Payload exacto coordinado con el Backend blindado y la estructura de tu BD
    const articuloParaEnviar = {
      codigo: this.articulo.codigo || (esServicio ? 'SERV-' : 'ART-') + Date.now(),
      nombre: this.articulo.nombre,
      categoria: this.tipoArticulo, // Manda 'Z', 'S', 'A' o 'SERVICIO' directo para que encaje en MySQL
      id_proveedor: 1, // Proveedor por defecto inicial
      costo: this.articulo.costo || 0, 
      precio_venta: this.articulo.precio,
      creado_por: 1, // ID del operador estático por ahora

      // JUAN (UX): Si es servicio, los detalles físicos viajan limpios en lugar de generar texto basura
      marca: esServicio ? 'Mano de Obra' : (this.articulo.marcaNombre || 'Sin Marca'),
      color: esServicio ? '' : (this.articulo.color || 'N/A'),
      material: esServicio ? '' : (this.articulo.material || 'N/A'),
      style: esServicio ? '' : (this.articulo.forma || 'N/A'), // Se guarda en la columna estilo de la BD
      puente: 0,
      diagonal: 0,
      base: 'N/A',

      // Control del Stock físico inicial en Matriz (HL01)
      id_sucursal: 'HL01', 
      // JUAN (UX): Un servicio no maneja stock físico; forzamos valores en 0 para evitar alertas rojas innecesarias en la campana
      stock_inicial: esServicio ? 0 : (this.articulo.cantidad || 0),
      stock_minimo: esServicio ? 0 : (this.articulo.stockMinimo || 5),
      ubicacion: esServicio ? 'Clínica / Laboratorio' : 'Mostrador' 
    };

    console.log('Enviando nuevo artículo al backend:', articuloParaEnviar);

    this.inventarioService.crearArticulo(articuloParaEnviar).subscribe({
      next: (response: any) => {
        console.log('¡Artículo guardado con éxito!', response);
        this.modalCtrl.dismiss(articuloParaEnviar, 'confirm');
      },
      error: (err: any) => {
        console.error('Error al registrar artículo en el servidor:', err);
      }
    });
  }
}