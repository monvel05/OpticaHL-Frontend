import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    // Verifica que esta ruta al layout sea la correcta
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        // Verifica que esta ruta al login sea la correcta
        loadComponent: () => import('./features/auth/login/login.page').then(m => m.LoginPage)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  // Esta línea es opcional pero ayuda a que si escribes algo mal, no truene la app
  { path: '**', redirectTo: 'auth/login' } 
];