import { Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, 
  IonContent, IonItem, IonAvatar, IonLabel, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonInput, 
  IonTextarea, ModalController 
} from '@ionic/angular/standalone';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../shared/interfaces/cliente.interface';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-formulario-receta',
  templateUrl: './formulario-receta.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule, 
    ReactiveFormsModule,
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonTitle, 
    IonContent, 
    IonItem, 
    IonAvatar, 
    IonLabel, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent, 
    IonGrid, 
    IonRow, 
    IonCol, 
    IonInput, 
    IonTextarea
  ]
})
export class FormularioRecetaComponent implements OnInit {
  @Input() cliente!: Cliente;
  @Input() datosPreexistentes?: any; // 🎯 Recibe los valores de la receta anterior si se va a "editar"

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private clienteService = inject(ClienteService);
  private authService = inject(AuthService);
  recetaForm!: FormGroup;

  constructor() {
    addIcons({ closeOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    this.initForm();
    // 🎯 Si nos pasaron datos preexistentes, los cargamos en el formulario de inmediato
    if (this.datosPreexistentes) {
      this.recetaForm.patchValue({
        od_esfera: this.datosPreexistentes.od_esfera,
        od_cilindro: this.datosPreexistentes.od_cilindro,
        od_eje: Number(this.datosPreexistentes.od_eje) || 0,
        od_adicion: this.datosPreexistentes.od_adicion,
        oi_esfera: this.datosPreexistentes.oi_esfera,
        oi_cilindro: this.datosPreexistentes.oi_cilindro,
        oi_eje: Number(this.datosPreexistentes.oi_eje) || 0,
        oi_adicion: this.datosPreexistentes.oi_adicion,
        distancia_pupilar: this.datosPreexistentes.distancia_pupilar,
        observaciones: this.datosPreexistentes.observaciones
      });
    }
  }

  initForm() {
    this.recetaForm = this.fb.group({
      od_esfera: ['+0.00', [Validators.required]],
      od_cilindro: ['-0.00', [Validators.required]],
      od_eje: [0, [Validators.required, Validators.min(0), Validators.max(180)]],
      od_adicion: ['0.00'],
      oi_esfera: ['+0.00', [Validators.required]],
      oi_cilindro: ['-0.00', [Validators.required]],
      oi_eje: [0, [Validators.required, Validators.min(0), Validators.max(180)]],
      oi_adicion: ['0.00'],
      distancia_pupilar: ['', [Validators.required]],
      observaciones: ['']
    });
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  guardarReceta() {
    if (this.recetaForm.invalid || !this.cliente?.id_cliente) return;

    const formValues = this.recetaForm.value;
    const authDinamico = this.authService as any;
    const id_sucursal = authDinamico.usuario?.id_sucursal || authDinamico.currentUser?.id_sucursal || 'HL01';

    // 🎯 Al usar guardarNuevaRX siempre generamos una nueva fila, preservando la anterior intacta
    const payloadRX = {
      od_esfera: formValues.od_esfera,
      od_cilindro: formValues.od_cilindro,
      od_eje: String(formValues.od_eje),
      od_adicion: formValues.od_adicion || '0.00',
      oi_esfera: formValues.oi_esfera,
      oi_cilindro: formValues.oi_cilindro,
      oi_eje: String(formValues.oi_eje),
      oi_adicion: formValues.oi_adicion || '0.00',
      distancia_pupilar: formValues.distancia_pupilar,
      observaciones: formValues.observaciones || 'Evolución basada en receta anterior.',
      id_sucursal: id_sucursal
    };

    this.clienteService.guardarNuevaRX(this.cliente.id_cliente, payloadRX).subscribe({
      next: (response: { success: boolean; message: string; folio: string }) => {
        this.modalCtrl.dismiss(response, 'confirm');
      },
      error: (err: any) => console.error('Error al persistir la receta:', err)
    });
  }
}