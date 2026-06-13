import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../shared/interfaces/cliente.interface';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkCircleOutline } from 'ionicons/icons';
// Verifica minuciosamente que esta ruta suba las carpetas correctas hasta tu 'auth.service.ts'
import { AuthService } from '../../../core/services/auth.service';
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
    const payloadRX = {
      ojo: 'AMBOS', 
      esfera: `OD: ${formValues.od_esfera} | OI: ${formValues.oi_esfera}`,
      cilindro: `OD: ${formValues.od_cilindro} | OI: ${formValues.oi_cilindro}`,
      eje: formValues.od_eje, 
      adicion: formValues.adicion || '0.00',
      distancia_pupilar: formValues.distancia_pupilar,
      observaciones: formValues.observaciones || 'Sin observaciones adicionales.'
    };

    console.log('Guardando receta clínica en la base de datos:', payloadRX);

    // 🛠️ SE AGREGA EL TIPADO EN EL NEXT Y ERROR PARA REMOVER EL PROBLEMA DE TYPESCRIPT
    this.clienteService.guardarNuevaRX(this.cliente.id_cliente, payloadRX).subscribe({
      next: (response: any) => { // 👈 Tipado agregado
        console.log('¡Transacción de receta completada en MySQL!', response);
        this.modalCtrl.dismiss(response, 'confirm');
      },
      error: (err: any) => console.error('Error al persistir la receta clínica:', err) // 👈 Tipado agregado
    });
  }
}