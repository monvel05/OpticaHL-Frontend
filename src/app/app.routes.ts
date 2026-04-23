import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/login/login.page').then(m => m.LoginPage)
      },
      // Si alguien entra a /auth, lo mandamos directo a /auth/login
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: 'inventario',
    loadComponent: () => import('./features/inventario/inventario.page').then(m => m.InventarioPage),
  },
  {
    path: 'calizdeformulario',
    loadComponent: () => import('./features/calizdeformulario/calizdeformulario.page').then( m => m.CalizdeformularioPage)
  },
  {
    path: '',
    redirectTo: 'auth/login', // Ruta completa para evitar confusiones
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'inventario' // Si se pierden, mejor mandarlos al inventario (o al login)
  }
];