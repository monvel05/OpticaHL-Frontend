import {
  Component,
  Input,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, 
  IonContent, IonCard, IonCardHeader, IonCardSubtitle, IonCardContent, 
  IonItem, IonInput, IonGrid, IonRow, IonCol, IonTextarea,
  IonSegment, IonSegmentButton, IonBadge, IonLabel,
  ModalController, AlertController 
} from '@ionic/angular/standalone';
import { SelectorEntidadComponent } from '../selector-entidad/selector-entidad.component';

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
  trashOutline,
  pricetagOutline,
  businessOutline,
  cubeOutline,
  addOutline,
  removeOutline,
  buildOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-formulario-articulo',
  standalone: true,
  imports: [
    FormsModule, 
    SelectorEntidadComponent,
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardSubtitle, 
    IonCardContent, 
    IonItem, 
    IonInput, 
    IonGrid, 
    IonRow, 
    IonCol, 
    IonTextarea,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    IonLabel
  ],
  templateUrl: './formulario-articulo.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./formulario-articulo.component.scss'],
})
export class FormularioArticuloComponent implements OnInit {
  @Input() tipoArticulo: string = 'ARMAZON';
  @Input() articuloExistente: any = null;

  private modalCtrl = inject(ModalController);
  private inventarioService = inject(InventarioService);
  private alertController = inject(AlertController);

  tituloVista: string = '';

  articulo: any = {
    codigo: '',
    nombre: '',
    marcaId: null,
    marcaNombre: '',
    precio: 0,
    costo: 0,
    stockMinimo: 5,
    material: '',
    color: '',
    forma: '',
    descripcion: '',
  };

  public stocksSucursales: { [key: string]: number } = {};
  public sucursalesLista: { id: string; nombre: string }[] = [];

  marcasDisponibles: any[] = [
    { id: 1, nombre: 'Ray-Ban' },
    { id: 2, nombre: 'Oakley' },
    { id: 3, nombre: 'Vogue' },
    { id: 4, nombre: 'Prada' },
    { id: 5, nombre: 'Carrera' },
    { id: 6, nombre: 'Genérica / Económica' },
  ];

  constructor() {
    addIcons({
      barcodeOutline,
      glassesOutline,
      cashOutline,
      documentTextOutline,
      closeOutline,
      layersOutline,
      colorPaletteOutline,
      shapesOutline,
      trashOutline,
      pricetagOutline,
      businessOutline,
      cubeOutline,
      addOutline,
      removeOutline,
      buildOutline
    });
  }

  ngOnInit() {
    this.definirTituloYValores();

    this.inventarioService.obtenerSucursales().subscribe((sucs) => {
      if (sucs && sucs.length > 0) {
        this.sucursalesLista = sucs.map(s => ({
          id: String(s.id_sucursal),
          nombre: s.nombre || `Sucursal ${s.id_sucursal}`
        }));
      } else {
        this.sucursalesLista = [
          { id: 'HL01', nombre: 'Matriz Hospital de Lentes' },
          { id: 'HL02', nombre: 'Sucursal Norte' }
        ];
      }

      const existingStocks = this.articuloExistente?.stocks_sucursales || {};
      this.sucursalesLista.forEach(suc => {
        if (existingStocks[suc.id] !== undefined) {
          this.stocksSucursales[suc.id] = Number(existingStocks[suc.id]);
        } else if (this.articuloExistente && suc.id === 'HL01') {
          this.stocksSucursales[suc.id] = Number(this.articuloExistente.stock_actual || 0);
        } else {
          this.stocksSucursales[suc.id] = 0;
        }
      });
    });

    if (this.articuloExistente) {
      this.tituloVista = 'Editar ' + this.tituloVista;
      this.articulo = {
        ...this.articulo,
        codigo: this.articuloExistente.codigo || '',
        nombre: this.articuloExistente.nombre || '',
        precio: this.articuloExistente.precio_venta || 0,
        costo: this.articuloExistente.costo || 0,
        stockMinimo: this.articuloExistente.stock_minimo || 5,
        marcaNombre: this.articuloExistente.marca || '',
        color: this.articuloExistente.color || '',
        material: this.articuloExistente.material || '',
        forma: this.articuloExistente.estilo || '',
        descripcion: this.articuloExistente.descripcion || '',
      };
    }
  }

  definirTituloYValores() {
    switch (this.tipoArticulo) {
      case 'ARMAZON':
      case 'Z':
        this.tituloVista = 'Armazón';
        this.tipoArticulo = 'ARMAZON';
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
        this.tipoArticulo = 'SERVICIO';
        break;
      default:
        this.tituloVista = 'Artículo';
    }
  }

  onCategoriaChange(event: any) {
    this.tipoArticulo = event.detail.value;
    this.definirTituloYValores();
  }

  onMarcaSelected(marca: any) {
    this.articulo.marcaId = marca.id;
    this.articulo.marcaNombre = marca.nombre;
  }

  stockTotalCalculado(): number {
    if (this.tipoArticulo === 'SERVICIO') return 0;
    return Object.values(this.stocksSucursales).reduce((a, b) => Number(a || 0) + Number(b || 0), 0);
  }

  ajustarStockSucursal(sucId: string, delta: number) {
    const actual = Number(this.stocksSucursales[sucId] || 0);
    const nuevo = Math.max(0, actual + delta);
    this.stocksSucursales[sucId] = nuevo;
  }

  cerrar() {
    this.modalCtrl.dismiss();
  }

  guardar() {
    const esServicio = this.tipoArticulo === 'SERVICIO';

    const articuloParaEnviar = {
      codigo: this.articulo.codigo || (esServicio ? 'SERV-' : 'ART-') + Date.now(),
      nombre: this.articulo.nombre,
      categoria: this.tipoArticulo,
      id_proveedor: 1,
      costo: Number(this.articulo.costo) || 0,
      precio_venta: Number(this.articulo.precio) || 0,
      creado_por: 1,
      marca: esServicio ? 'Mano de Obra' : this.articulo.marcaNombre || 'Sin Marca',
      color: esServicio ? '' : this.articulo.color || 'N/A',
      material: esServicio ? '' : this.articulo.material || 'N/A',
      estilo: esServicio ? '' : this.articulo.forma || 'N/A',
      puente: 0,
      diagonal: 0,
      base: 'N/A',
      id_sucursal: 'HL01',
      stock_inicial: esServicio ? 0 : this.stockTotalCalculado(),
      stock_minimo: esServicio ? 0 : Number(this.articulo.stockMinimo) || 5,
      stocks_sucursales: esServicio ? {} : this.stocksSucursales
    };

    if (this.articuloExistente && this.articuloExistente.id_articulo) {
      this.inventarioService
        .actualizarArticulo(
          this.articuloExistente.id_articulo,
          articuloParaEnviar,
        )
        .subscribe({
          next: (response: any) => {
            this.modalCtrl.dismiss(articuloParaEnviar, 'confirm');
          },
          error: (err: any) => console.error('Error al actualizar artículo:', err),
        });
    } else {
      this.inventarioService.crearArticulo(articuloParaEnviar).subscribe({
        next: (response: any) => {
          this.modalCtrl.dismiss(articuloParaEnviar, 'confirm');
        },
        error: (err: any) => console.error('Error al registrar artículo:', err),
      });
    }
  }

  async confirmarEliminacion() {
    const alert = await this.alertController.create({
      header: 'Eliminar Artículo',
      message: '¿Estás seguro de que deseas desactivar este artículo del catálogo?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, Eliminar',
          role: 'destructive',
          handler: () => {
            if (this.articuloExistente && this.articuloExistente.id_articulo) {
              this.inventarioService
                .desactivarArticulo(this.articuloExistente.id_articulo)
                .subscribe({
                  next: () => {
                    this.modalCtrl.dismiss({ eliminado: true }, 'confirm');
                  },
                  error: (err) => console.error('Error al eliminar el artículo', err),
                });
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
