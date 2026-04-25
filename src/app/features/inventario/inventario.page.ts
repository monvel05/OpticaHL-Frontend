import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, searchOutline, alertCircleOutline, pricetagOutline, businessOutline } from 'ionicons/icons';
import { SelectorEntidadComponent } from '../../shared/components/selector-entidad/selector-entidad.component';
import { InventarioService } from '../../core/services/inventario';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.page.html',
  styleUrls: ['./inventario.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, SelectorEntidadComponent]
})
export class InventarioPage implements OnInit {

  segmentoActual: string = 'armazones';
  searchTerm: string = '';
  
  marcas = [
    { id: 1, nombre: 'Ray-Ban' },
    { id: 2, nombre: 'Oakley' },
    { id: 3, nombre: 'Vogue' },
    { id: 4, nombre: 'Arnette' }
  ];

  // Inicializamos vacío para recibir los datos del backend
  productos: any[] = [];
  productosFiltrados: any[] = [];

  constructor(private inventarioService: InventarioService) {
    // Registramos todos los iconos que usamos en el HTML
    addIcons({ add, searchOutline, alertCircleOutline, pricetagOutline, businessOutline });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  // Función para conectar con tu Backend
  cargarDatos() {
    this.inventarioService.getInventario().subscribe({
      next: (data) => {
        this.productos = data;
        this.filtrar();
        console.log('Datos cargados del backend con éxito');
      },
      error: (err) => {
        console.error('Error conectando al backend, usando datos de prueba local.', err);
        // Backup por si el backend falla durante el desarrollo
        this.productos = [
          { id: 1, nombre: 'Ray-Ban Aviator', marca: 'Ray-Ban', cantidad: 2, stockMinimo: 5, tipo: 'armazones' },
          { id: 2, nombre: 'Oakley Sport', marca: 'Oakley', cantidad: 10, stockMinimo: 3, tipo: 'armazones' },
          { id: 3, nombre: 'Líquido Limpiador', marca: 'Splash', cantidad: 1, stockMinimo: 5, tipo: 'accesorios' },
        ];
        this.filtrar();
      }
    });
  }

  cambiarSegmento(event: any) {
    this.segmentoActual = event.detail.value;
    this.filtrar();
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value?.toLowerCase() || '';
    this.filtrar();
  }

  filtrar() {
    this.productosFiltrados = this.productos.filter(p => {
      const coincideTipo = p.tipo === this.segmentoActual;
      const coincideBusqueda = p.nombre.toLowerCase().includes(this.searchTerm) || 
                               p.marca.toLowerCase().includes(this.searchTerm);
      return coincideTipo && coincideBusqueda;
    });
  }

  // Esta es la función que llama tu componente compartido SelectorEntidad
  tuFuncionDePrueba(idSeleccionado: any) {
    console.log('Filtrando por marca ID:', idSeleccionado);
    
    if (idSeleccionado) {
      const marcaObj = this.marcas.find(m => m.id === idSeleccionado);
      if (marcaObj) {
        this.productosFiltrados = this.productos.filter(p => 
          p.marca === marcaObj.nombre && p.tipo === this.segmentoActual
        );
      }
    } else {
      this.filtrar(); // Si quitan la selección, resetear filtros
    }
  }

  agregarProducto() {
    console.log('Abrir modal de formulario para:', this.segmentoActual);
  }
}