import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-selector-entidad',
  templateUrl: './selector-entidad.component.html',
  styleUrls: ['./selector-entidad.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule,FormsModule]
})
export class SelectorEntidadComponent {
  // Recibe el texto que dirá el selector (Ej: "Marca")
  @Input() label: string = 'Seleccionar';
  
  // Recibe el icono de Ionic (Ej: "business-outline")
  @Input() icon: string = 'chevron-down-outline';
  
  // Recibe la lista de datos [{id: 1, nombre: 'Ray-Ban'}, ...]
  @Input() opciones: any[] = [];

  // Emite el ID de lo que el usuario seleccionó
  @Output() seleccionCambiada = new EventEmitter<number>();

  onValueChange(event: any) {
    this.seleccionCambiada.emit(event.detail.value);
  }
}