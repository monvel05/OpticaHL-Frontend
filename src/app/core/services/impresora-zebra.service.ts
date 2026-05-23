import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environment/envs';

@Injectable({
  providedIn: 'root'
})
export class ImpresoraZebraService {
  private zebraUrl = environment.zebraUrl;

  constructor(private http: HttpClient) {}

  /**
   * Genera el código ZPL para una etiqueta estándar de óptica
   * Tamaño típico: 50mm x 25mm
   */
  generarZPL(producto: any): string {
    return `
      ^XA
      ^CI28
      ^FO30,30^A0N,25,25^FDHospital de Lentes^FS
      ^FO30,65^A0N,20,20^FD${producto.nombre.substring(0, 30)}^FS
      ^FO30,95^A0N,20,20^FDColor: ${producto.color || 'N/A'}^FS
      ^FO30,120^BCN,40,Y,N,N^FD${producto.codigo}^FS
      ^FO30,190^A0N,30,30^FD$${producto.precio_venta}^FS
      ^XZ
    `.replace(/^\s+/gm, ''); // Limpiamos espacios en blanco extra
  }

  /**
   * Envía el código ZPL crudo a la aplicación Zebra Browser Print local
   */
  imprimirEtiqueta(producto: any): Observable<any> {
    const zplCode = this.generarZPL(producto);
    
    // Para probar visualmente el código ZPL puedes copiar lo que sale en consola
    // y pegarlo en http://labelary.com/viewer.html
    console.log('Código ZPL a imprimir:', zplCode);

    // Se envía como texto plano
    return this.http.post(this.zebraUrl, zplCode, { responseType: 'text' }).pipe(
      catchError(error => {
        console.error('Error al contactar con Zebra Browser Print. ¿Está abierto en la PC?', error);
        return throwError(() => new Error('No se pudo conectar con la impresora. Verifica que Zebra Browser Print esté en ejecución.'));
      })
    );
  }
}