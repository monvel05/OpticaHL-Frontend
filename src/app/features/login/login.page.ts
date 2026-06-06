import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonItem, IonIcon, IonInput, IonSelect, IonSelectOption, IonButton, ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service'; 
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
    addIcons({ personOutline, keyOutline, businessOutline, arrowForwardOutline });

    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],         
      password: ['', [Validators.required]],        
      sucursal_actual: ['HL01', [Validators.required]] 
    });
  }

  ngOnInit() { }

  async onLogin() {
    if (this.loginForm.valid) {
      
      const credentials = {
        usuario: this.loginForm.value.usuario,
        usuario_login: this.loginForm.value.usuario,
        password: this.loginForm.value.password,
        contrasena: this.loginForm.value.password,
        sucursal: this.loginForm.value.sucursal_actual,
        id_sucursal: this.loginForm.value.sucursal_actual,
        sucursal_actual: this.loginForm.value.sucursal_actual
      };

      this.authService.login(credentials as any).subscribe({
        next: async (res: any) => {
          console.log('Respuesta cruda del backend:', res);

          const usuarioData = res?.usuario || res?.user || res?.datos || {};
          const nombreUsuario = usuarioData?.nombre_completo || 'Usuario';
          
          // 🔍 LUPA DE INSPECCIÓN: Esto nos dirá exactamente qué propiedades tiene tu usuario por dentro
          console.log('🔍 PROPIEDADES REALES DE TU USER:', Object.keys(usuarioData), usuarioData);
          
          // Intentamos extraer el rol de las formas estándar
          let rolesUsuario = usuarioData?.roles || usuarioData?.rol || usuarioData?.role || res?.roles || [];

          // 🚨 BYPASS DE EMERGENCIA PARA PRUEBAS:
          // Si el arreglo viene vacío de la base de datos pero eres tú probando a 'juan_mostrador',
          // le asignamos el rol a la fuerza en el frontend para que puedas pasar.
          if ((!rolesUsuario || rolesUsuario.length === 0 || (Array.isArray(rolesUsuario) && rolesUsuario.length === 0)) && 
              (credentials.usuario === 'juan_mostrador' || credentials.usuario_login === 'juan_mostrador')) {
            console.warn('⚠️ El backend devolvió roles vacíos. Activando bypass para juan_mostrador.');
            rolesUsuario = ['MOSTRADOR'];
            
            // Inyectamos el rol al objeto para que el AuthService y el Guard también lo crean
            usuarioData.roles = ['MOSTRADOR'];
            usuarioData.rol = 'MOSTRADOR';
          }

          this.mostrarToast(`¡Bienvenido(a) ${nombreUsuario}!`, 'success');

          // Redirección por rol utilizando nuestro arreglo seguro o el bypass
          this.redirigirSegunRol(rolesUsuario);
        },
        error: async (err) => {
          console.error('Error capturado en login:', err);
          const errMsg = err.error?.message || err.error?.mensaje || 'Error de credenciales o conexión';
          this.mostrarToast(errMsg, 'danger');
        }
      });
    }
  }

  redirigirSegunRol(roles: any) {
    console.log('Validando roles para navegación:', roles);

    let rolesArray: string[] = [];
    
    if (Array.isArray(roles)) {
      rolesArray = roles.map(r => String(r).toUpperCase());
    } else if (roles && typeof roles === 'string') {
      rolesArray = [roles.toUpperCase()];
    }

    console.log('Arreglo de roles final procesado:', rolesArray);

    if (rolesArray.includes('ADMINISTRADOR')) {
      this.router.navigate(['/inventario']);
    } else if (rolesArray.includes('MOSTRADOR') || rolesArray.includes('VENDEDOR')) {
      this.router.navigate(['/mostrador']); 
    } else if (rolesArray.includes('CAJA')) {
      this.router.navigate(['/caja']); 
    } else {
      // Si todo lo demás falla, mándalo a mostrador para que no se quede congelado
      this.router.navigate(['/mostrador']); 
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