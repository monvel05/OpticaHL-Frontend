import { provideZoneChangeDetection } from "@angular/core";
import 'zone.js';  // Included with Angular CLI.
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { tokenInterceptor } from './app/core/auth/interceptors/token.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    
    // 🚀 Registro global del interceptor de tokens
    provideHttpClient(withXhr(), 
      withInterceptors([tokenInterceptor])
    ),
    
    provideCharts(withDefaultRegisterables()),
  ],
});