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
    loadComponent: () => import('./features/calizdeformulario/calizdeformulario.page').then(m => m.CalizdeformularioPage)
  },
  {
    path: 'orden',
    loadComponent: () => import('./features/orden/orden.page').then(m => m.OrdenPage)
  },
  {
    path: 'caja',
    loadComponent: () => import('./features/caja/caja.page').then(m => m.CajaPage)
  },
  {
    path: 'cortecaja',
    loadComponent: () => import('./features/cortecaja/cortecaja.page').then(m => m.CorteCajaPage)
  },
  {
    path: 'ordenes',
    loadComponent: () => import('./features/ordenes/ordenes.page').then(m => m.OrdenesPage)
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