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
  IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton
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
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonListHeader,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton
  ]
})
export class OrdenPage implements OnInit {
  public cartService = inject(CartService);
  private clientesService = inject(ClienteService);
  private inventarioService = inject(InventarioService);
  private ordenService = inject(OrdenService);

  public filteredProducts = signal<any[]>([]);
  public searchTerm = signal('');
  public isLoading = signal(false);

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
    this.inventarioService.getArticulosStream().subscribe((productos: Articulo[]) => {
      this.productosDisponibles = productos;
    });
    this.inventarioService.cargarArticulos('HL01');
  }

  openPatientModal() {
    this.openPatientSelector();
  }

  goToPayments() {
    this.proceedToCheckout();
  }

  onSearchProduct(event: any) {
    const query = event.detail.value?.toLowerCase() || '';
    this.searchTerm.set(query);

    if (query && query.length > 2) {
      this.isLoading.set(true);
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

  async openPatientSelector() {
    this.clientesService.getClientes().subscribe({
      next: (pacientes: any[]) => {
        if (pacientes.length > 0) {
          const seleccionado = pacientes[0];
          this.cartService.selectedPatient.set({
            id: seleccionado.id,
            nombre: seleccionado.nombre
          });
        }
      },
      error: (err: any) => console.error('Error al traer pacientes:', err)
    });
  }

  addProductToCart(product: Articulo) {
    const idString = product.id_articulo ? product.id_articulo.toString() : '0';
    let tipoMapeado: 'armazon' | 'lente' | 'servicio' = 'armazon';
    const categoriaBD = product.categoria?.toLowerCase();

    if (categoriaBD === 'lente_contacto' || categoriaBD === 'lente') {
      tipoMapeado = 'lente';
    } else if (categoriaBD === 'servicio') {
      tipoMapeado = 'servicio';
    }

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