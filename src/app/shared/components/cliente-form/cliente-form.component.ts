import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClientesService } from '../../../core/services/clientes.service'; 

@Component({
  selector: 'app-cliente-form',
  templateUrl: './cliente-form.component.html', // <-- CORREGIDO A .html
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class ClienteFormComponent implements OnInit {
  @Input() clienteData: any = null; 
  @Output() onSave = new EventEmitter<any>(); 
  @Output() onCancel = new EventEmitter<void>();

  clienteForm!: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private clientesService: ClientesService // Inyectado correctamente
  ) {
    this.initForm();
  }

  ngOnInit() {
    if (this.clienteData) {
      this.clienteForm.patchValue(this.clienteData);
    }
  }

  initForm() {
    this.clienteForm = this.fb.group({
      nombre_completo: ['', [Validators.required]],
      rfc: ['', [Validators.pattern('^[A-Z0-9]{12,13}$')]], 
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10,20}$')]],
      email: ['', [Validators.required, Validators.email]],
      domicilio: [''],
      colonia: [''],
      cp: ['', [Validators.pattern('^[0-9]{5}$')]],
      localidad: [''],
      estado: [''],
      cve_historica: ['']
    });
  }

  submitForm() {
    if (this.clienteForm.valid) {
      // 1. Llamamos al servicio para guardar en SQL
      this.clientesService.crearCliente(this.clienteForm.value).subscribe({
        next: (res) => {
          console.log('Cliente guardado:', res);
          // 2. Avisamos al componente padre que todo salió bien
          this.onSave.emit(res);
        },
        error: (err) => {
          console.error('Error al guardar cliente:', err);
          // Aquí podrías poner un mensaje de error para el usuario
        }
      });
    } else {
      this.clienteForm.markAllAsTouched();
    }
  }
}