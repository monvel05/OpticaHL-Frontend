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

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private clienteService = inject(ClienteService);
  private authService = inject(AuthService);
  recetaForm!: FormGroup;

  constructor() {
    addIcons({ closeOutline, checkmarkCircleOutline });
    this.initForm();
  }

  ngOnInit() {
    console.log('Abriendo expediente clínico para el paciente:', this.cliente);
  }

  initForm() {
    this.recetaForm = this.fb.group({
      // Ojo Derecho (OD)
      od_esfera: ['+0.00', [Validators.required]],
      od_cilindro: ['-0.00', [Validators.required]],
      od_eje: [0, [Validators.required, Validators.min(0), Validators.max(180)]],
      od_adicion: ['0.00'], // Adición separada para OD
      
      // Ojo Izquierdo (OI)
      oi_esfera: ['+0.00', [Validators.required]],
      oi_cilindro: ['-0.00', [Validators.required]],
      oi_eje: [0, [Validators.required, Validators.min(0), Validators.max(180)]],
      oi_adicion: ['0.00'], // Adición separada para OI
      
      // Detalles Generales
      distancia_pupilar: ['', [Validators.required]],
      observaciones: ['']
    });
  }

  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  guardarReceta() {
    if (this.recetaForm.invalid || !this.cliente.id_cliente) return;

    const formValues = this.recetaForm.value;

    // 🎯 PAYLOAD ACTUALIZADO: Envía los campos de forma individual tal como los espera la nueva tabla de MySQL
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
      observaciones: formValues.observaciones || 'Sin observaciones adicionales.'
    };

    console.log('Enviando datos estructurados al backend:', payloadRX);

    this.clienteService.guardarNuevaRX(this.cliente.id_cliente, payloadRX).subscribe({
      next: (response: any) => {
        console.log('¡Transacción de receta completada en MySQL con estructura limpia!', response);
        this.modalCtrl.dismiss(response, 'confirm');
      },
      error: (err: any) => console.error('Error al persistir la receta clínica estructurada:', err)
    });
  }
}