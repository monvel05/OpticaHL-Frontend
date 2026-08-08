import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, 
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonText, 
  IonList, IonItem, IonLabel, IonNote, AlertController, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { printOutline, cashOutline, cardOutline, receiptOutline, logOutOutline } from 'ionicons/icons';
import { CajaService } from '../../core/services/caja.service';
import{ AuthService } from 'src/app/core/services/auth.service';
@Component({
  selector: 'app-corte-caja',
  templateUrl: './cortecaja.page.html',
  styleUrls: ['./cortecaja.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonContent, 
    IonGrid, 
    IonRow, 
    IonCol, 
    IonCard, 
    IonCardContent, 
    IonText, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonNote
  ]
})
export class CorteCajaPage implements OnInit {
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private cajaService = inject(CajaService);
  private authService = inject(AuthService);
  // Signal reactiva para los movimientos reales
  movimientos = signal<any[]>([]);

  // Computed Signals para los cálculos automáticos en base a tu backend
  totalEfectivo = computed(() => {
    return this.movimientos()
      .filter(m => m.metodo_pago === 'EFECTIVO' && m.tipo_movimiento === 'INGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0);
  });

  totalBanco = computed(() => {
    return this.movimientos()
      .filter(m => (m.metodo_pago === 'TARJETA' || m.metodo_pago === 'TRANSFERENCIA') && m.tipo_movimiento === 'INGRESO')
      .reduce((sum, m) => sum + Number(m.monto), 0);
  });

  totalDia = computed(() => this.totalEfectivo() + this.totalBanco());

  constructor() {
    addIcons({printOutline,logOutOutline,receiptOutline,cashOutline,cardOutline});
  }

  ngOnInit() {
    this.cargarMovimientosDelDia();
  }

  /**
   * CORREGIDO: Llama a tu método real 'getMovimientos()'
   */
  cargarMovimientosDelDia() {
    this.cajaService.getMovimientos().subscribe({
      next: (res: any[]) => {
        this.movimientos.set(res || []);
      },
      error: (err: any) => {
        console.error('Error al cargar movimientos de caja:', err);
      }
    });
  }

  async confirmarCierre() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Cierre de Turno',
      message: `¿Estás seguro de cerrar la caja con un total acumulado de ${this.totalDia()}? Se guardará el historial operativo.`,
      buttons: [
        { text: 'Volver a revisar', role: 'cancel' },
        { 
          text: 'Sí, Cerrar Caja', 
          handler: () => this.ejecutarCierreDeCaja() 
        }
      ]
    });
    await alert.present();
  }

  /**
   * CORREGIDO: Usamos 'registrarMovimiento' para guardar el cierre. 
   * Mandamos un tipo_movimiento: 'CIERRE' para que tu backend sepa diferenciarlo de un ingreso.
   */
  ejecutarCierreDeCaja() {
    const resumenCorte = {
      id_sucursal: 'HL01',
      id_operador: 1,
      tipo_movimiento: 'CIERRE',
      metodo_pago: 'EFECTIVO', // Campo requerido por tu estructura general
      monto: this.totalDia(),
      concepto: `CIERRE DE TURNO: Efct: ${this.totalEfectivo()} - Banco: ${this.totalBanco()}. Total Movs: ${this.movimientos().length}`
    };

    this.cajaService.registrarMovimiento(resumenCorte).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: '¡Corte de caja guardado con éxito! Turno finalizado de forma correcta.',
          duration: 3000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        
        // Refrescamos o limpiamos la pantalla tras cerrar la caja
        this.cargarMovimientosDelDia();
      },
      error: (err: any) => {
        console.error('Error al guardar el corte de caja:', err);
        alert('Hubo un problema al intentar guardar el cierre financiero.');
      }
    });
  }

  obtenerIconoPago(metodo: string): string {
    switch (metodo?.toUpperCase()) {
      case 'EFECTIVO': return 'cash-outline';
      case 'TARJETA': return 'card-outline';
      default: return 'receipt-outline';
    }
  }

  obtenerColorIcono(metodo: string): string {
    switch (metodo?.toUpperCase()) {
      case 'EFECTIVO': return 'success';
      case 'TARJETA': return 'primary';
      default: return 'warning';
    }
  }

  imprimirResumen() {
    window.print();
  }
  async logout() {
    await this.authService.logout();
  }
}