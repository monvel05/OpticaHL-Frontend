import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonItem, IonIcon, IonInput, IonSelect, IonSelectOption, IonButton, ToastController } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service'; 
import { SucursalesService, Sucursal } from '../../core/services/sucursales.service';
import { addIcons } from 'ionicons';
import { personOutline, keyOutline, businessOutline, arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
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
  public sucursalesActivas: Sucursal[] = [
    { id_sucursal: 'HL01', nombre: 'Matriz Hospital de Lentes', activo: true },
    { id_sucursal: 'HL02', nombre: 'Sucursal Norte', activo: true }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private sucursalesService: SucursalesService,
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

  ngOnInit() {
    this.cargarSucursalesActivas();
  }

  cargarSucursalesActivas() {
    this.sucursalesService.obtenerSucursales({ activo: 'true' }).subscribe({
      next: (sucursales) => {
        if (sucursales && sucursales.length > 0) {
          this.sucursalesActivas = sucursales;
          const actualVal = this.loginForm.get('sucursal_actual')?.value;
          if (!this.sucursalesActivas.some(s => s.id_sucursal === actualVal)) {
            this.loginForm.patchValue({ sucursal_actual: this.sucursalesActivas[0].id_sucursal });
          }
        }
      },
      error: (err) => console.warn('No se pudieron cargar sucursales activas en login, usando respaldo:', err)
    });
  }

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
          
          console.log('🔍 PROPIEDADES REALES DE TU USER:', Object.keys(usuarioData), usuarioData);
          
          let rolesUsuario = usuarioData?.roles || usuarioData?.rol || usuarioData?.role || usuarioData?.id_rol || res?.roles || [];

          if ((!rolesUsuario || rolesUsuario.length === 0) && 
              (credentials.usuario === 'juan_mostrador' || credentials.usuario_login === 'juan_mostrador')) {
            console.warn('⚠️ Activando bypass para juan_mostrador.');
            rolesUsuario = ['MOSTRADOR'];
            usuarioData.roles = ['MOSTRADOR'];
            usuarioData.rol = 'MOSTRADOR';
          }

          if ((!rolesUsuario || rolesUsuario.length === 0 || rolesUsuario === 2) && 
              (credentials.usuario === 'amendoza' || credentials.usuario_login === 'amendoza')) {
            console.warn('⚠️ Activando bypass de rol para el Optometrista amendoza.');
            rolesUsuario = ['OPTOMETRISTA'];
            usuarioData.roles = ['OPTOMETRISTA'];
            usuarioData.id_rol = 2;
            usuarioData.rol = 'OPTOMETRISTA';
          }

          if (usuarioData.roles && Array.isArray(usuarioData.roles)) {
            usuarioData.roles = usuarioData.roles.map((r: any) => String(r).toUpperCase().includes('CAJE') ? 'CAJA' : r);
          }
          if (usuarioData.rol && String(usuarioData.rol).toUpperCase().includes('CAJE')) {
            usuarioData.rol = 'CAJA';
          }
          if (Array.isArray(rolesUsuario)) {
            rolesUsuario = rolesUsuario.map(r => String(r).toUpperCase().includes('CAJE') ? 'CAJA' : r);
          } else if (rolesUsuario && String(rolesUsuario).toUpperCase().includes('CAJE')) {
            rolesUsuario = 'CAJA';
          }

          this.mostrarToast(`¡Bienvenido(a) ${nombreUsuario}!`, 'success');
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
      rolesArray = roles.map(r => String(r).trim().toUpperCase());
    } else if (roles !== null && roles !== undefined) {
      rolesArray = [String(roles).trim().toUpperCase()];
    }

    console.log('Arreglo de roles final procesado:', rolesArray);

    const esAdmin = rolesArray.some(r => r.includes('ADMIN') || r === '1');
    const esOptometrista = rolesArray.some(r => r.includes('OPTOMETRISTA') || r === '2');
    const esMostrador = rolesArray.some(r => r.includes('MOSTRADOR') || r.includes('VENDEDOR') || r === '4');
    const esCaja = rolesArray.some(r => r.includes('CAJA') || r.includes('CAJERO') || r === '3');

    if (esAdmin) {
      console.log('-> Ejecutando navegación a: /inventario');
      this.router.navigate(['/inventario']);
    } else if (esOptometrista) {
      console.log('-> Ejecutando navegación a: /optometrista');
      this.router.navigateByUrl('/optometrista'); 
    } else if (esMostrador) {
      console.log('-> Ejecutando navegación a: /mostrador');
      this.router.navigate(['/mostrador']); 
    } else if (esCaja) {
      console.log('-> Ejecutando navegación a: /caja');
      this.router.navigate(['/caja']); 
    } else {
      console.warn('Rol no emparejado en los filtros tradicionales, forzando enrutamiento.');
      this.router.navigateByUrl('/optometrista'); 
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