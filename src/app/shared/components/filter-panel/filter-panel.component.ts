import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReportFilterService } from '../../../core/services/report-filter.service';
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './filter-panel.component.html'
})
export class FilterPanelComponent implements OnInit {
  filterForm: FormGroup;
  // Simulación de roles (Luego lo conectas a tu AuthService)
  esAdmin: boolean = true; 
  sucursales = [{id: '1', nombre: 'Sucursal Centro'}, {id: '2', nombre: 'Sucursal Norte'}];

  constructor(private fb: FormBuilder, private filterService: ReportFilterService) {
    this.filterForm = this.fb.group({
      sucursalId: [''],
      fechaInicio: [''],
      fechaFin: ['']
    });
  }

  ngOnInit() {
    // Cada vez que el formulario cambie, enviamos los datos al servicio
    this.filterForm.valueChanges.subscribe(valores => {
      this.filterService.actualizarFiltros(valores);
    });
  }
}