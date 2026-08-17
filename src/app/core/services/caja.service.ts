import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  private http = inject(HttpClient);
  private api = 'http://localhost:3000/api/caja';

  getMovimientos() {
    return this.http.get<any[]>(this.api);
  }

  registrarMovimiento(data: any) {
    return this.http.post(this.api, data);
  }

  getCorteCaja() {
    return this.http.get<any>(`${this.api}/corte`);
  }

  obtenerOrdenParaCobro(folio: string): Observable<any> {
    return this.http.get<any>(`${this.api}/orden/${folio.trim()}`);
  }

  descargarTicketPDF(folio: string): Observable<Blob> {
    return this.http.get(`${this.api}/ticket/${folio.trim()}`, {
      responseType: 'blob'
    });
  }

  // 📄 MÉTODO AGREGADO PARA DESCARGAR EL PDF DEL CORTE DE CAJA
  descargarTicketCortePDF(): Observable<Blob> {
    return this.http.get(`${this.api}/corte/pdf`, {
      responseType: 'blob'
    });
  }
}