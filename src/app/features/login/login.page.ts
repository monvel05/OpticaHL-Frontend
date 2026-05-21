import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { IonContent, IonItem, IonIcon, IonInput, IonSelect, IonSelectOption, IonButton, ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service'; // Asegúrate de que esta ruta sea correcta
import { addIcons } from 'ionicons';
import { personOutline, keyOutline, businessOutline, arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    // Registramos los íconos para la versión Standalone de Ionic
    addIcons({ personOutline, keyOutline, businessOutline, arrowForwardOutline });

    // Tarea 3.1: Ajustamos las claves para coincidir con el AuthService y el Backend
    this.loginForm = this.fb.group({
      usuario_login: ['', [Validators.required]],        
      contrasena: ['', [Validators.required]],
      sucursal_actual: ['HL01', [Validators.required]]
    });
  }

  ngOnInit() {}

  async onLogin() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value;
      
      this.authService.login(credentials).subscribe({
        next: async (res) => {
          // El servicio ya guardó el Token y el Usuario de forma segura en Capacitor Preferences (Tarea 3.3)
          
          // Saludo usando la propiedad correcta de tu interfaz Usuario
          this.mostrarToast(`¡Bienvenido(a) ${res.usuario.nombre_completo}!`, 'success');

          // Redirección por rol
          this.redirigirSegunRol(res.usuario.roles);
        },
        error: async (err) => {
          // Captura el mensaje de error del backend de tu compañera
          const errMsg = err.error?.message || 'Error de credenciales o conexión';
          this.mostrarToast(errMsg, 'danger');
        }
      });
    }
  }

  redirigirSegunRol(roles: string[]) {
    console.log('Validando roles para navegación:', roles);
    
    // Normalizamos a mayúsculas para evitar fallos por formato
    const rolesUpper = roles.map(r => r.toUpperCase());

    if (rolesUpper.includes('ADMINISTRADOR')) {
      this.router.navigate(['/inventario']);
    } else if (rolesUpper.includes('VENDEDOR') || rolesUpper.includes('MOSTRADOR')) {
      this.router.navigate(['/ventas']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}