import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `
})
export class AuthLayoutComponent {}