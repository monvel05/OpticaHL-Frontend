import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env';

export interface ReporteSoportePayload {
  tipo: 'falla' | 'funcion';
  descripcion: string;
  departamento?: string;
  operador?: {
    id_operador?: number;
    nombre_completo?: string;
    usuario_login?: string;
    roles?: string[];
    id_sucursal?: number | string;
  };
  sucursal?: string | number;
  rutaActual?: string;
}

export interface RespuestaSoporte {
  ok: boolean;
  mensaje?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SoporteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/soporte`;

  enviarReporte(payload: ReporteSoportePayload): Observable<RespuestaSoporte> {
    return this.http.post<RespuestaSoporte>(`${this.apiUrl}/reportar`, payload);
  }
}
