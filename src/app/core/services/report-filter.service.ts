import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FiltrosDashboard {
  sucursalId: string;
  fechaInicio: string;
  fechaFin: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportFilterService {
  // Inicializamos con valores por defecto (ej. hoy)
  private filtrosSubject = new BehaviorSubject<FiltrosDashboard>({
    sucursalId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0]
  });

  // Observable que los componentes "escucharán"
  filtros$ = this.filtrosSubject.asObservable();

  actualizarFiltros(nuevosFiltros: FiltrosDashboard) {
    this.filtrosSubject.next(nuevosFiltros);
  }
}