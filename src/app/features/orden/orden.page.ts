import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService, OrderItem } from '../../core/services/cart.service';
import { ClienteService } from '../../core/services/cliente.service';
import { InventarioService, Articulo } from '../../core/services/inventario.service'; 
import { OrdenService } from '../../core/services/orden.service';
import { addIcons } from 'ionicons';
import {
  personOutline, trashOutline, cartOutline,
  addCircleOutline, checkmarkCircleOutline, searchOutline
} from 'ionicons/icons';
import {
  IonContent, IonList, IonItem, IonLabel, IonSearchbar,
  IonButton, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonListHeader,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-orden',
  templateUrl: './orden.page.html',
  styleUrls: ['./orden.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule, FormsModule, IonContent,
    IonList, IonItem, IonLabel, IonSearchbar, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonListHeader
  ]
})
export class OrdenPage implements OnInit {
  // Inyección de servicios usando inject()
  public cartService = inject(CartService);
  private clientesService = inject(ClienteService);
  private inventarioService = inject(InventarioService);
  private ordenService = inject(OrdenService);

  // Signals para el manejo del estado de la UI
  public filteredProducts = signal<any[]>([]);
  public searchTerm = signal('');
  public isLoading = signal(false);

  // Copia local para búsqueda reactiva instantánea
  private productosDisponibles: Articulo[] = [];

  constructor() {
    addIcons({
      personOutline,
      trashOutline,
      cartOutline,
      addCircleOutline,
      checkmarkCircleOutline,
      searchOutline
    });
  }

  ngOnInit() {
    console.log('POS Conectado a Servicios Reales');
    
    // Suscripción al stream reactivo de artículos de la base de datos
    this.inventarioService.getArticulosStream().subscribe((productos: Articulo[]) => {
      this.productosDisponibles = productos;
    });

    // Petición inicial del inventario físico para la sucursal activa
    this.inventarioService.cargarArticulos('HL01');
  }

  openPatientModal() {
    this.openPatientSelector();
  }

  goToPayments() {
    this.proceedToCheckout();
  }

  /**
   * Búsqueda en tiempo real alineada a la Base de Datos
   */
  onSearchProduct(event: any) {
    const query = event.detail.value?.toLowerCase() || '';
    this.searchTerm.set(query);

    if (query && query.length > 2) {
      this.isLoading.set(true);

      // Filtro local directo sobre los datos sincronizados
      const filtrados = this.productosDisponibles.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        (p.marca && p.marca.toLowerCase().includes(query)) ||
        p.categoria?.toLowerCase().includes(query)
      );

      this.filteredProducts.set(filtrados);
      this.isLoading.set(false);
    } else {
      this.filteredProducts.set([]);
    }
  }

  /**
   * Selección Real de Paciente
   */
  async openPatientSelector() {
    this.clientesService.getClientes().subscribe({
      next: (pacientes: any[]) => {
        if (pacientes.length > 0) {
          const seleccionado = pacientes[0];
          this.cartService.selectedPatient.set({
            id: seleccionado.id,
            nombre: seleccionado.nombre
          });
          console.log('Paciente conectado:', seleccionado);
        }
      },
      error: (err: any) => console.error('Error al traer pacientes:', err)
    });
  }

  /**
   * Gestión del Carrito con tipado estricto (Mapeo BD -> OrderItem)
   */
  addProductToCart(product: Articulo) {
    // 1. Convertimos el ID numérico a String para cumplir con la interfaz del carrito
    const idString = product.id_articulo ? product.id_articulo.toString() : '0';

    // 2. Clasificamos de forma segura la categoría según los literales válidos
    let tipoMapeado: 'armazon' | 'lente' | 'servicio' = 'armazon';
    const categoriaBD = product.categoria?.toLowerCase();

    if (categoriaBD === 'lente_contacto' || categoriaBD === 'lente') {
      tipoMapeado = 'lente';
    } else if (categoriaBD === 'servicio') {
      tipoMapeado = 'servicio';
    }

    // 3. Estructuración del objeto según las necesidades de CartService
    const newItem: OrderItem = {
      id: idString, 
      name: product.nombre,
      price: product.precio_venta || 0,
      quantity: 1,
      type: tipoMapeado
    };

    this.cartService.addItem(newItem);
    this.filteredProducts.set([]); 
    this.searchTerm.set(''); 
  }

  removeProduct(index: number) {
    this.cartService.removeItem(index);
  }

  proceedToCheckout() {
    if (this.cartService.isOrderValid()) {
      const orderData = {
        pacienteId: this.cartService.selectedPatient()?.id,
        items: this.cartService.items(),
        total: this.cartService.total()
      };
      console.log('Enviando a Caja:', orderData);
    }
  }
}