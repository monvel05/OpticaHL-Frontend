import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/envs';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private apiUrl = `${environment.apiUrl}/reportes`; 

  constructor(private http: HttpClient) {}

  obtenerReporteDescuentos(mes: number, anio: number): Observable<any> {
    const params = new HttpParams().set('mes', mes).set('anio', anio);
    return this.http.get(`${this.apiUrl}/descuentos`, { params });
  }

  obtenerReporteVentasCompleto(fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams().set('fechaInicio', fechaInicio).set('fechaFin', fechaFin);
    return this.http.get(`${this.apiUrl}/ventas-completo`, { params });
  }
}

