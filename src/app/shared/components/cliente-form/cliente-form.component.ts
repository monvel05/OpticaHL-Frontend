import { Component, OnInit, Input, inject, ChangeDetectionStrategy } from '@angular/core';

import { 
  IonHeader, IonToolbar, IonButtons, IonButton, IonIcon, IonTitle, 
  IonContent, IonListHeader, IonLabel, IonList, IonItem, IonInput, 
  IonGrid, IonRow, IonCol, ModalController, AlertController 
} from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service'; 
import { addIcons } from 'ionicons';
import { 
  personOutline, callOutline, phonePortraitOutline, mailOutline, cardOutline, 
  locationOutline, save, closeOutline, trashOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-cliente-form',
  templateUrl: './cliente-form.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    ReactiveFormsModule,
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonTitle, 
    IonContent, 
    IonListHeader, 
    IonLabel, 
    IonList, 
    IonItem, 
    IonInput, 
    IonGrid, 
    IonRow, 
    IonCol
  ]
})
export class ClienteFormComponent implements OnInit {
  // 🎯 Recibe el paciente si se abre el modal en modo EDICIÓN
  @Input() cliente: any = null;

  private fb = inject(FormBuilder);
  private clientesService = inject(ClienteService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  clienteForm!: FormGroup;

  constructor() {
    addIcons({
      personOutline,
      callOutline,
      phonePortraitOutline,
      mailOutline,
      cardOutline,
      locationOutline,
      save,
      closeOutline,
      trashOutline
    });
    this.initForm();
  }

  ngOnInit() {
    // 🎯 Si se pasó un cliente por @Input, precargamos sus datos en el formulario
    if (this.cliente) {
      this.cargarDatosCliente(this.cliente);
    }
  }

  initForm() {
    this.clienteForm = this.fb.group({
      nombre_completo: ['', [Validators.required]],
      rfc: ['', [Validators.pattern('^[a-zA-Z0-9]{12,13}$')]], 
      telefono: [''],
      celular: [''],
      email: ['', [Validators.email]],
      domicilio: [''],
      colonia: [''],
      cp: [''],
      localidad: [''],
      estado: ['']
    });
  }

  /**
   * Precarga la información preexistente para edición
   */
  cargarDatosCliente(data: any) {
    this.clienteForm.patchValue({
      nombre_completo: data.nombre_completo || '',
      rfc: data.rfc || '',
      telefono: data.telefono || '',
      celular: data.celular || '',
      email: data.email || '',
      domicilio: data.domicilio || '',
      colonia: data.colonia || '',
      cp: data.cp || '',
      localidad: data.localidad || '',
      estado: data.estado || ''
    });
  }

  /**
   * Cierra el modal sin guardar cambios
   */
  cancelar() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  /**
   * Elimina el cliente tras confirmación del usuario
   */
  async eliminarCliente() {
    const idCliente = this.cliente?.id_cliente || this.cliente?.id;
    if (!idCliente) return;

    const alert = await this.alertCtrl.create({
      header: '⚠️ Eliminar Paciente',
      message: `¿Estás seguro de que deseas eliminar a "${this.cliente.nombre_completo}"? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, Eliminar',
          role: 'destructive',
          handler: () => {
            this.clientesService.eliminarCliente(idCliente).subscribe({
              next: (res) => {
                this.modalCtrl.dismiss({ deleted: true, id_cliente: idCliente }, 'deleted');
              },
              error: (err) => {
                console.error('Error al eliminar cliente:', err);
                const mensaje = err.error?.message || err.error?.error || 'No se pudo eliminar el cliente.';
                this.alertCtrl.create({
                  header: 'Error al eliminar',
                  message: mensaje,
                  buttons: ['Aceptar']
                }).then(a => a.present());
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  submitForm() {
    if (this.clienteForm.valid) {
      const datosParaEnviar = {
        ...this.clienteForm.value,
        rfc: this.clienteForm.value.rfc ? this.clienteForm.value.rfc.toUpperCase() : null
      };

      // 🔄 MODO EDICIÓN: Si el cliente ya existe en la BD (tiene id_cliente)
      if (this.cliente && (this.cliente.id_cliente || this.cliente.id)) {
        const idCliente = this.cliente.id_cliente || this.cliente.id;
        console.log(`Actualizando datos del cliente ID (${idCliente}):`, datosParaEnviar);

        this.clientesService.actualizarCliente(idCliente, datosParaEnviar).subscribe({
          next: (res) => {
            console.log('¡Cliente actualizado exitosamente en SQL!', res);

            const clienteActualizado = {
              id_cliente: idCliente,
              ...datosParaEnviar
            };

            this.modalCtrl.dismiss(clienteActualizado, 'confirm');
          },
          error: (err) => {
            console.error('Error al actualizar el cliente:', err);
          }
        });

      } else {
        // 🆕 MODO REGISTRO NUEVO: Si no viene un objeto de cliente preexistente
        console.log('Enviando datos del nuevo cliente al Backend:', datosParaEnviar);

        this.clientesService.crearCliente(datosParaEnviar).subscribe({
          next: (res) => {
            console.log('¡Cliente guardado exitosamente en SQL!', res);

            const nuevoClienteRegistrado = {
              id_cliente: res.id_cliente || res.data?.id_cliente,
              ...datosParaEnviar
            };

            this.modalCtrl.dismiss(nuevoClienteRegistrado, 'confirm');
          },
          error: (err) => {
            console.error('Error al registrar cliente en el servidor:', err);
          }
        });
      }

    } else {
      this.clienteForm.markAllAsTouched();
    }
  }
}