import { Injectable, computed, signal } from '@angular/core';

// Definimos interfaces claras para evitar el 'any'
export interface Patient {
  id: string;
  nombre: string;
  apellido?: string;
  telefono?: string;
}

export interface Rx {
  id: string;
  od_esfera: string;
  oi_esfera: string;
  // añade aquí los campos que ya usas en la semana 9
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'armazon' | 'lente' | 'servicio';
}

@Injectable({ providedIn: 'root' })
export class CartService {
  // Cambiamos 'any' por nuestras interfaces
  selectedPatient = signal<Patient | null>(null);
  selectedRx = signal<Rx | null>(null);
  items = signal<OrderItem[]>([]);

  // Cálculos automáticos
  subtotal = computed(() => 
    this.items().reduce((acc, item) => acc + (item.price * item.quantity), 0)
  );
  
  iva = computed(() => this.subtotal() * 0.16);
  total = computed(() => this.subtotal() + this.iva());

  // Validación de Reglas de Negocio
  isOrderValid = computed(() => {
    return this.selectedPatient() !== null && this.items().length > 0;
  });

  addItem(product: OrderItem) { // Tipamos el producto
    this.items.update(prev => [...prev, product]);
  }

  removeItem(index: number) {
    this.items.update(prev => prev.filter((_, i) => i !== index));
  }

  // Método para resetear la orden después de pagar
  clearCart() {
    this.selectedPatient.set(null);
    this.selectedRx.set(null);
    this.items.set([]);
  }
}