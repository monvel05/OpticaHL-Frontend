import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
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
  shapesOutline,
  trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-formulario-articulo',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SelectorEntidadComponent],
  templateUrl: './formulario-articulo.component.html',
  styleUrls: ['./formulario-articulo.component.scss'],
})
export class FormularioArticuloComponent implements OnInit {
  // Recibe la categoría ('ARMAZON', 'MICA', 'ACCESORIO', 'SERVICIO') directo desde el inventario principal
  @Input() tipoArticulo: string = 'ARMAZON'; 
  
  // 🆕 RECIBE DATOS SI ESTAMOS EN MODO EDICIÓN
  @Input() articuloExistente: any = null; 

  private modalCtrl = inject(ModalController);
  private inventarioService = inject(InventarioService);
  private alertController = inject(AlertController); // 🆕 INYECTADO PARA EL AVISO DE ELIMINAR

  // Título dinámico estandarizado para la interfaz de usuario
  tituloVista: string = '';

  // Modelo ampliado con los campos obligatorios 
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
      'color-palette-outline': colorPaletteOutline, 
      shapesOutline,
      trashOutline 
    });
  }

  ngOnInit() {
    console.log('Abriendo formulario para código de categoría:', this.tipoArticulo);
    this.definirTituloYValores();

    if (this.articuloExistente) {
      this.tituloVista = 'Editar ' + this.tituloVista;
      this.articulo = {
        ...this.articulo,
        codigo: this.articuloExistente.codigo,
        nombre: this.articuloExistente.nombre,
        precio: this.articuloExistente.precio_venta,
        costo: this.articuloExistente.costo,
        cantidad: this.articuloExistente.stock_actual,
        stockMinimo: this.articuloExistente.stock_minimo,
        marcaNombre: this.articuloExistente.marca,
        color: this.articuloExistente.color,
        material: this.articuloExistente.material,
        forma: this.articuloExistente.estilo,
        descripcion: this.articuloExistente.descripcion || ''
      };
    }
  }

  /**
   * Traduce la categoría a un texto legible para el título del usuario
   * Mantiene compatibilidad con 'Z', 'S', 'A' por si llegan letras viejas
   */
  definirTituloYValores() {
    switch(this.tipoArticulo) {
      case 'ARMAZON':
      case 'Z': 
        this.tituloVista = 'Armazón'; 
        this.tipoArticulo = 'ARMAZON'; // Estandariza a palabra completa
        break;
      case 'MICA':
      case 'S': 
        this.tituloVista = 'Mica / Cristal'; 
        this.tipoArticulo = 'MICA';
        break;
      case 'ACCESORIO':
      case 'A': 
        this.tituloVista = 'Accesorio'; 
        this.tipoArticulo = 'ACCESORIO';
        break;
      case 'SERVICIO': 
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
      categoria: this.tipoArticulo, // Manda 'ARMAZON', 'MICA', 'ACCESORIO' o 'SERVICIO'
      id_proveedor: 1, // Proveedor por defecto inicial
      costo: this.articulo.costo || 0, 
      precio_venta: this.articulo.precio,
      creado_por: 1, // ID del operador estático por ahora

      marca: esServicio ? 'Mano de Obra' : (this.articulo.marcaNombre || 'Sin Marca'),
      color: esServicio ? '' : (this.articulo.color || 'N/A'),
      material: esServicio ? '' : (this.articulo.material || 'N/A'),
      style: esServicio ? '' : (this.articulo.forma || 'N/A'), // Se guarda en la columna estilo de la BD
      puente: 0,
      diagonal: 0,
      base: 'N/A',

      // Control del Stock físico inicial en Matriz (HL01)
      id_sucursal: 'HL01', 
      stock_inicial: esServicio ? 0 : (this.articulo.cantidad || 0),
      stock_minimo: esServicio ? 0 : (this.articulo.stockMinimo || 5),
      ubicacion: esServicio ? 'Clínica / Laboratorio' : 'Mostrador' 
    };

    console.log('Enviando artículo al backend:', articuloParaEnviar);

    if (this.articuloExistente && this.articuloExistente.id_articulo) {
      this.inventarioService.actualizarArticulo(this.articuloExistente.id_articulo, articuloParaEnviar).subscribe({
        next: (response: any) => {
          console.log('¡Artículo actualizado con éxito!', response);
          this.modalCtrl.dismiss(articuloParaEnviar, 'confirm');
        },
        error: (err: any) => {
          console.error('Error al actualizar artículo:', err);
        }
      });
    } else {
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


  async confirmarEliminacion() {
    const alert = await this.alertController.create({
      header: 'Eliminar Artículo',
      message: '¿Estás seguro de que deseas desactivar este artículo del catálogo? Esta acción quedará registrada en la bitácora de seguridad.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Sí, Eliminar', 
          role: 'destructive',
          handler: () => {
            if (this.articuloExistente && this.articuloExistente.id_articulo) {
              this.inventarioService.desactivarArticulo(this.articuloExistente.id_articulo).subscribe({
                next: () => {
                  console.log('Artículo desactivado correctamente.');
                  // Enviamos 'eliminado: true' para que el padre recargue la lista
                  this.modalCtrl.dismiss({ eliminado: true }, 'confirm');
                },
                error: (err) => console.error('Error al eliminar el artículo', err)
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }
}