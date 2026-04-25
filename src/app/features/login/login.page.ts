import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router'; 
import { IonicModule, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { addIcons } from 'ionicons';
import { personOutline, keyOutline, businessOutline, arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ personOutline, keyOutline, businessOutline, arrowForwardOutline });

    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],        
      password: ['', [Validators.required]],
      sucursal_actual: ['HL01', [Validators.required]]
    });
  }

  ngOnInit() {}

  async onLogin() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value;
      
      this.authService.login(credentials).subscribe({
        next: async (res: any) => {
          // Guardar sesión
          await this.authService.setToken(res.token);
          localStorage.setItem('id_operador', res.user.id_operador);
          localStorage.setItem('sucursal', res.user.sucursal);

          // Saludo
          this.mostrarToast(`¡Bienvenida ${res.user.nombre}!`, 'success');

          // REDIRECCIÓN DINÁMICA POR ROL
          this.redirigirSegunRol(res.user.roles);
        },
        error: async (err) => {
          this.mostrarToast(err.error.message || 'Error de conexión', 'danger');
        }
      });
    }
  }

  // LA FUNCIÓN DEPENDIENDO DEL ROL
  redirigirSegunRol(roles: string[]) {
    console.log('Validando roles para navegación:', roles);
    
    if (roles.includes('ADMINISTRADOR')) {
      this.router.navigate(['/inventario']);
    } else if (roles.includes('VENDEDOR')) {
      this.router.navigate(['/ventas']);
    } else {
      // Por si acaso hay un usuario sin rol definido
      this.router.navigate(['/home']);
    }
  }

  // Función auxiliar para no repetir código de los mensajes
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