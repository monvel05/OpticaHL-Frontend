import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Importaciones de Ionic Standalone
import { 
  IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle, 
  IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle, IonFooter,
} from '@ionic/angular/standalone'; 

// Servicios
import { AuthService, Usuario } from './core/services/auth.service';

// Importación y registro de Iconos
import { addIcons } from 'ionicons';
import { 
  cubeOutline, cashOutline, documentTextOutline, 
  peopleOutline, logOutOutline, cartOutline, eyeOutline,barChartOutline
} from 'ionicons/icons';

// Interfaz para la configuración de las rutas
interface AppPage {
  title: string;
  url: string;
  icon: string;
  roles: string[]; // Qué roles pueden ver este elemento
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterModule,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonFooter
]
})
export class AppComponent implements OnInit, OnDestroy {
  public appPages: AppPage[] = [];
  public isAuthenticated = false;
  
  private authSub!: Subscription;
  private userSub!: Subscription;

  // Catálogo maestro de todas las páginas del sistema y sus roles autorizados
  // Esto debe hacer match con lo que tienes en app.routes.ts
  private allPages: AppPage[] = [

  { title: 'Mostrador', url: '/mostrador', icon: 'people-outline', roles: ['MOSTRADOR', 'ADMINISTRADOR'] },
  { title: 'Órdenes', url: '/orden', icon: 'document-text-outline', roles: ['MOSTRADOR', 'CAJA', 'ADMINISTRADOR'] },
  { title: 'Caja', url: '/caja', icon: 'cash-outline', roles: ['CAJA', 'ADMINISTRADOR'] },
  { title: 'Corte de Caja', url: '/cortecaja', icon: 'document-text-outline', roles: ['CAJA', 'ADMINISTRADOR'] },
  { title: 'Inventario', url: '/inventario', icon: 'cube-outline', roles: ['ADMINISTRADOR'] },
  { title: 'Operadores', url: '/operadores', icon: 'people-outline', roles: ['ADMINISTRADOR'] },
  { title: 'Optometrista', url: '/optometrista', icon: 'eye-outline', roles: ['OPTOMETRISTA', 'ADMINISTRADOR'] },
  { title: 'Reportes', url: '/reportes', icon: 'barChartOutline', roles: ['ADMINISTRADOR'] }
];

  constructor(private authService: AuthService, private router: Router) {
    // 1. Registramos los iconos globalmente para Standalone
    addIcons({
      'cube-outline': cubeOutline,
      'cash-outline': cashOutline,
      'document-text-outline': documentTextOutline,
      'people-outline': peopleOutline,
      'cart-outline': cartOutline,
      'log-out-outline': logOutOutline,
      'eye-outline': eyeOutline,
      'barChartOutline': barChartOutline
    });
  }

  ngOnInit() {
    // 2. Suscribirse al estado booleano de autenticación (mostrar/ocultar menú)
    this.authSub = this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    // 3. Suscribirse al objeto Usuario para filtrar los módulos disponibles
    this.userSub = this.authService.currentUser$.subscribe((user: Usuario | null) => {
      if (user) {
        this.buildMenuForUser(user);
      } else {
        this.appPages = [];
      }
    });
  }

  ngOnDestroy() {
    // Limpieza de suscripciones para evitar memory leaks
    if (this.authSub) this.authSub.unsubscribe();
    if (this.userSub) this.userSub.unsubscribe();
  }

  /**
   * Filtra el catálogo maestro de páginas basado en el/los rol(es) del usuario actual
   */
  private buildMenuForUser(user: Usuario) {
    const userRolesRaw = user.roles || (user as any).rol || [];
    const rolesArray = Array.isArray(userRolesRaw) ? userRolesRaw : [userRolesRaw];
    const uppercaseRoles = rolesArray.map(r => String(r).toUpperCase());

    this.appPages = this.allPages.filter(page => 
      // Comprueba si al menos UNO de los roles del usuario coincide con los permitidos en la página
      page.roles.some(rolPermitido => uppercaseRoles.includes(rolPermitido.toUpperCase()))
    );
  }

  /**
   * Función para cerrar sesión desde el menú
   */
  async logout() {
    await this.authService.logout();
  }
}