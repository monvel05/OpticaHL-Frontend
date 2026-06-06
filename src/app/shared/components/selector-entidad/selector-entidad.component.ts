import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-selector-entidad',
  templateUrl: './selector-entidad.component.html',
  styleUrls: ['./selector-entidad.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class SelectorEntidadComponent {
  // Recibe el texto que dirá el selector (Ej: "Marca")
  @Input() label: string = 'Seleccionar';
  
  // Recibe el icono de Ionic (Ej: "pricetag-outline")
  @Input() icon: string = 'pricetag-outline';
  
  // Recibe la lista de datos [{id: 1, nombre: 'Ray-Ban'}, ...]
  @Input() opciones: any[] = [];

  // CORREGIDO: Cambiamos el nombre a 'seleccionado' para que coincida exactamente con tu formulario
  @Output() seleccionado = new EventEmitter<any>();

  onValueChange(event: any) {
    const idSeleccionado = event.detail.value;
    
    // Buscamos el objeto completo (id y nombre) dentro de las opciones disponibles
    const objetoCompleto = this.opciones.find(opc => opc.id === idSeleccionado);
    
    if (objetoCompleto) {
      // Emitimos el objeto entero { id: 1, nombre: 'Ray-Ban' } hacia el formulario
      this.seleccionado.emit(objetoCompleto);
    }
  }
}