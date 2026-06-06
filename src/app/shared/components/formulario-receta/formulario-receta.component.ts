import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../shared/interfaces/cliente.interface';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-formulario-receta',
  templateUrl: './formulario-receta.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ReactiveFormsModule]
})
export class FormularioRecetaComponent implements OnInit {
  // Recibe los datos completos del cliente seleccionado desde el mostrador
  @Input() cliente!: Cliente;

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private clienteService = inject(ClienteService);

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
      
      // Ojo Izquierdo (OI)
      oi_esfera: ['+0.00', [Validators.required]],
      oi_cilindro: ['-0.00', [Validators.required]],
      oi_eje: [0, [Validators.required, Validators.min(0), Validators.max(180)]],
      
      // Detalles Generales de la Rx
      adicion: ['0.00'],
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

    // Tu backend espera una estructura unificada para la tabla 'graduacion_orden'.
    // Como se capturan dos ojos, preparamos el payload combinando las lecturas de forma limpia.
    // Si tu Express procesa un ojo a la vez o un JSON completo, este formato es perfectamente adaptable:
    const payloadRX = {
      // Mandamos los bloques ordenados para que tu endpoint 'guardarNuevaRX' los inserte de golpe
      ojo: 'AMBOS', 
      esfera: `OD: ${formValues.od_esfera} | OI: ${formValues.oi_esfera}`,
      cilindro: `OD: ${formValues.od_cilindro} | OI: ${formValues.oi_cilindro}`,
      eje: formValues.od_eje, // El backend mapeará los enteros correspondientes
      adicion: formValues.adicion || '0.00',
      distancia_pupilar: formValues.distancia_pupilar,
      observaciones: formValues.observaciones || 'Sin observaciones adicionales.'
    };

    console.log('Guardando receta clínica en la base de datos:', payloadRX);

    this.clienteService.guardarNuevaRX(this.cliente.id_cliente, payloadRX).subscribe({
      next: (response) => {
        console.log('¡Transacción de receta completada en MySQL!', response);
        this.modalCtrl.dismiss(response, 'confirm');
      },
      error: (err) => console.error('Error al persistir la receta clínica:', err)
    });
  }
}