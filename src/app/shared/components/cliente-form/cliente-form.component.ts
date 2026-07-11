import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { IonicModule, ModalController } from '@ionic/angular'; // Inyectamos ModalController para cerrar
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service'; 
import { addIcons } from 'ionicons';
import { 
  personOutline, callOutline, mailOutline, cardOutline, 
  locationOutline, save, closeOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-cliente-form',
  templateUrl: './cliente-form.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IonicModule, ReactiveFormsModule]
})
export class ClienteFormComponent implements OnInit {
  // Quitamos los EventEmitters tradicionales ya que usaremos el ModalController nativo de Ionic, que es más limpio para Mostrador
  private fb = inject(FormBuilder);
  private clientesService = inject(ClienteService);
  private modalCtrl = inject(ModalController);

  clienteForm!: FormGroup;

  constructor() {
    // Registramos los iconos que tu formulario utiliza internamente
    addIcons({
      personOutline,
      callOutline,
      mailOutline,
      cardOutline,
      locationOutline,
      save,
      closeOutline
    });
    this.initForm();
  }

  ngOnInit() {
    // El formulario arranca limpio para un nuevo paciente
  }

  initForm() {
    this.clienteForm = this.fb.group({
      nombre_completo: ['', [Validators.required]],
      // Forzamos que acepte letras en minúsculas también en la validación si el usuario escribe directo
      rfc: ['', [Validators.pattern('^[a-zA-Z0-9]{12,13}$')]], 
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10,20}$')]],
      email: ['', [Validators.required, Validators.email]],
      domicilio: [''],
      colonia: [''],
      cp: ['', [Validators.pattern('^[0-9]{5}$')]],
      localidad: [''],
      estado: ['']
    });
  }

  /**
   * Cierra el modal sin guardar ningún dato
   */
  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  submitForm() {
    if (this.clienteForm.valid) {
      // Convertimos el RFC a mayúsculas de manera automatizada antes de mandarlo a la BD MySQL
      const datosParaEnviar = {
        ...this.clienteForm.value,
        rfc: this.clienteForm.value.rfc ? this.clienteForm.value.rfc.toUpperCase() : null
      };

      console.log('Enviando datos del nuevo cliente al Backend:', datosParaEnviar);

      this.clientesService.crearCliente(datosParaEnviar).subscribe({
        next: (res) => {
          console.log('¡Cliente guardado exitosamente en SQL!', res);
          
          // Construimos el objeto simulado con el ID que generó la base de datos (res.id_cliente)
          // para insertarlo de inmediato en la lista del mostrador sin tener que re-escribir
          const nuevoClienteRegistrado = {
            id_cliente: res.id_cliente,
            nombre_completo: datosParaEnviar.nombre_completo,
            telefono: datosParaEnviar.telefono,
            email: datosParaEnviar.email,
            domicilio: datosParaEnviar.domicilio,
            colonia: datosParaEnviar.colonia,
            cp: datosParaEnviar.cp,
            localidad: datosParaEnviar.localidad,
            estado: datosParaEnviar.estado
          };

          // Cerramos el modal regresando el rol de confirmación y el objeto
          this.modalCtrl.dismiss(nuevoClienteRegistrado, 'confirm');
        },
        error: (err) => {
          console.error('Error al registrar cliente en el servidor:', err);
        }
      });
    } else {
      this.clienteForm.markAllAsTouched();
    }
  }
}