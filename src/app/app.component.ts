import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone'; // Importa los componentes específicos
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet] // <--- ¡ESTA ES LA CLAVE! Agrégalos aquí
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    const token = await this.authService.getToken();
    if (token) {
      console.log('Sesión activa');
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}