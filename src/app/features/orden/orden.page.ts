import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService, OrderItem } from '../../core/services/cart.service';
import { ClientesService } from '../../core/services/clientes.service';
import { InventarioService } from '../../core/services/inventario.service';
import { addIcons } from 'ionicons';
import {
  personOutline, trashOutline, cartOutline,
  addCircleOutline, checkmarkCircleOutline, searchOutline
} from 'ionicons/icons';
import {
  IonContent, IonList, IonItem, IonLabel, IonSearchbar,
  IonButton, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonListHeader, IonNote, IonHeader, IonToolbar, IonTitle
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-orden',
  templateUrl: './orden.page.html',
  styleUrls: ['./orden.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent,
    IonList, IonItem, IonLabel, IonSearchbar, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonListHeader
  ]
})
export class OrdenPage implements OnInit {
  // Inyección de servicios
  public cartService = inject(CartService);
  private clientesService = inject(ClientesService);
  private inventarioService = inject(InventarioService);

  // Signals para la UI
  public filteredProducts = signal<any[]>([]);
  public searchTerm = signal('');
  public isLoading = signal(false);

  constructor() {
    addIcons({
      personOutline, trashOutline, cartOutline,
      addCircleOutline, checkmarkCircleOutline, searchOutline
    });
  }

  ngOnInit() {
    console.log('POS Conectado a Servicios Reales');
  }
  openPatientModal() {
    // Por ahora llamamos al selector que ya tienes
    this.openPatientSelector();
  }

  goToPayments() {
    // Por ahora llamamos al checkout que ya tienes
    this.proceedToCheckout();
  }

  /**
   * T1.1: Búsqueda Real de Productos (Semana 8)
   */
  onSearchProduct(event: any) {
    const query = event.detail.value?.toLowerCase();
    this.searchTerm.set(query);

    if (query && query.length > 2) {
      this.isLoading.set(true);

      // Llamada REAL a tu servicio de inventario
      // Nota: Ajusta 'buscarProductos' al nombre real de tu método en InventarioService
      this.inventarioService.getInventario().subscribe({
        next: (productos: any[]) => {
          // Filtramos en el cliente o puedes pedirle al backend que filtre
          const filtrados = productos.filter(p =>
            p.nombre.toLowerCase().includes(query) ||
            p.categoria?.toLowerCase().includes(query)
          );
          this.filteredProducts.set(filtrados);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error buscando productos:', err);
          this.isLoading.set(false);
        }
      });
    } else {
      this.filteredProducts.set([]);
    }
  }

  /**
   * T1.1: Selección Real de Paciente (Semana 9)
   */
  async openPatientSelector() {
    // Aquí podrías implementar un modal, por ahora traemos el primer cliente 
    // como prueba de conexión real.
    this.clientesService.getClientes().subscribe({
      next: (pacientes: any[]) => {
        if (pacientes.length > 0) {
          // Aquí idealmente abrirías un modal para que el usuario elija,
          // por ahora seleccionamos el primero para probar la conexión:
          const seleccionado = pacientes[0];
          this.cartService.selectedPatient.set({
            id: seleccionado.id,
            nombre: seleccionado.nombre // Asegúrate que la propiedad sea 'nombre' o 'name'
          });
          console.log('Paciente conectado:', seleccionado);
        }
      },
      error: (err) => console.error('Error al traer pacientes:', err)
    });
  }

  /**
   * T1.2: Gestión del Carrito
   */
  addProductToCart(product: any) {
    // Adaptamos el objeto del inventario al formato de la orden
    const newItem: OrderItem = {
      id: product.id,
      name: product.nombre || product.name, // Soporte para ambos nombres de propiedad
      price: product.precio_venta || product.price || 0,
      quantity: 1,
      type: product.tipo || 'armazon'
    };

    this.cartService.addItem(newItem);
    this.filteredProducts.set([]); // Limpiar resultados
    this.searchTerm.set(''); // Limpiar buscador
  }

  removeProduct(index: number) {
    this.cartService.removeItem(index);
  }

  /**
   * T1.3: Pase a Caja
   */
  proceedToCheckout() {
    if (this.cartService.isOrderValid()) {
      const orderData = {
        pacienteId: this.cartService.selectedPatient()?.id,
        items: this.cartService.items(),
        total: this.cartService.total()
      };
      console.log('Enviando a Caja:', orderData);
      // Aquí harías el router.navigate(['/pagos']);
    }
  }
}