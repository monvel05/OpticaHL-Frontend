import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/guard/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/login/login.page').then(m => m.LoginPage)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  
  // ==========================================
  // RUTAS PROTEGIDAS CON CONTROL DE ROLES
  // ==========================================
  {
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['ADMINISTRADOR', 'MOSTRADOR', 'CAJA', 'OPTOMETRISTA'] }
  },
  {
    path: 'inventario',
    loadComponent: () => import('./features/inventario/inventario.page').then(m => m.InventarioPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['ADMINISTRADOR', 'INVENTARIO'] } 
  },
  {
    path: 'caja',
    loadComponent: () => import('./features/caja/caja.page').then(m => m.CajaPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['CAJA', 'CAJER@', 'ADMINISTRADOR'] } 
  },
  {
    path: 'cortecaja',
    loadComponent: () => import('./features/cortecaja/cortecaja.page').then(m => m.CortecajaPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['CAJA', 'CAJER@', 'ADMINISTRADOR'] } 
  },
  {
    path: 'mostrador',
    loadComponent: () => import('./features/mostrador/mostrador.page').then(m => m.MostradorPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['MOSTRADOR', 'ADMINISTRADOR'] } 
  },
  {
    path: 'crrito',
    loadComponent: () => import('./features/crrito/crrito.page').then(m => m.CrritoPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['MOSTRADOR', 'ADMINISTRADOR'] } 
  },
  {
    path: 'orden',
    loadComponent: () => import('./features/orden/orden.page').then(m => m.OrdenPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['MOSTRADOR', 'CAJA', 'CAJER@', 'ADMINISTRADOR'] } 
  },
  {
    path: 'optometrista', 
    loadComponent: () => import('./features/optometrista/optometrista.page').then(m => m.OptometristaPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['OPTOMETRISTA', 'ADMINISTRADOR'] } 
  },
  {
    path: 'operadores', 
    loadComponent: () => import('./features/operadores/operadores.page').then(m => m.OperadoresPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['ADMINISTRADOR'] }
  },
  {
    path: 'facturacion',
    loadComponent: () => import('./features/facturacion/facturacion.page').then(m => m.FacturacionPage),
    canActivate: [roleGuard],
    data: { expectedRoles: ['ADMINISTRADOR', 'CONTADOR', 'CAJA', 'CAJER@', 'MOSTRADOR'] }
  },
  {
    path: 'reportes',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  
  // ==========================================
  // RUTAS PRUEBAS O REDIRECCIONES
  // ==========================================
  {
    path: 'calizdeformulario',
    loadComponent: () => import('./features/calizdeformulario/calizdeformulario.page').then(m => m.CalizdeformularioPage)
  },
  {
    path: '',
    redirectTo: 'auth/login', 
    pathMatch: 'full',
  },
  {
    path: '**', // Comodín siempre al final
    redirectTo: 'auth/login' 
  }
];