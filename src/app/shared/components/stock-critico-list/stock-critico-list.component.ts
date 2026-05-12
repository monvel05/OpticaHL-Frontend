import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Ya podrías quitarlo si no usas [ngClass] o pipes
import { InventarioService, Producto } from '../../../core/services/inventario.service';

@Component({
  selector: 'app-stock-critico-list',
  standalone: true,
  imports: [CommonModule], 
  template: `
    <div class="inventory-container">
      <h2>⚠️ Alerta de Stock Crítico</h2>
      <p>Los siguientes productos están por debajo del límite definido:</p>
      
      <table class="custom-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Stock Actual</th>
            <th>Stock Mínimo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (item of productos; track item.id) {
            <tr [class.row-critical]="item.cantidad <= item.stockMinimo">
              <td>{{ item.nombre }}</td>
              <td>{{ item.cantidad }}</td>
              <td>{{ item.stockMinimo }}</td>
              <td>
                @if (item.cantidad <= item.stockMinimo) {
                  <span class="badge-danger">REABASTECER</span>
                } @else {
                  <span class="badge-ok">OK</span>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="4" style="text-align: center;">No hay productos con stock crítico.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .row-critical { background-color: #ffebee; color: #c62828; font-weight: bold; }
    .badge-danger { background: #ef5350; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .badge-ok { color: #2e7d32; font-size: 0.8rem; }
    .custom-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
  `]
})
export class StockCriticoListComponent implements OnInit {
  productos: Producto[] = [];

  constructor(private inventarioService: InventarioService) {}

  ngOnInit() {
    this.obtenerStockCritico();
  }

  obtenerStockCritico() {
    this.inventarioService.getStockCritico().subscribe({
      next: (data) => this.productos = data,
      error: (err) => console.error('Error al obtener stock crítico', err)
    });
  }
}