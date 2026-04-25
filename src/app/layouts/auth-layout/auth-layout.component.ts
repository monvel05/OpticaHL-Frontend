import { Component } from '@angular/core';
import { IonContent, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [IonContent, IonRouterOutlet],
  template: `
    <ion-content>
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5;">
        <ion-router-outlet></ion-router-outlet>
      </div>
    </ion-content>
  `
})
export class AuthLayoutComponent {}