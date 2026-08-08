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
    path: 'inventario',
    loadComponent: () => import('./features/inventario/inventario.page').then(m => m.InventarioPage),
    canActivate: [roleGuard],
    // 🔒 Administradores y personal de almacén/inventario
    data: { expectedRoles: ['ADMINISTRADOR', 'INVENTARIO'] } 
  },
  {
    path: 'caja',
    loadComponent: () => import('./features/caja/caja.page').then(m => m.CajaPage),
    canActivate: [roleGuard],
    // 🔒 Cajeros y administradores
    data: { expectedRoles: ['CAJA', 'CAJER@', 'ADMINISTRADOR'] } 
  },
  {
    path: 'cortecaja',
    loadComponent: () => import('./features/cortecaja/cortecaja.page').then(m => m.CorteCajaPage),
    canActivate: [roleGuard],
    // 🔒 Cajeros y administradores
    data: { expectedRoles: ['CAJA', 'CAJER@', 'ADMINISTRADOR'] } 
  },
  {
    path: 'mostrador',
    loadComponent: () => import('./features/mostrador/mostrador.page').then(m => m.MostradorPage),
    canActivate: [roleGuard],
    // 🔒 Personal de mostrador y administradores
    data: { expectedRoles: ['MOSTRADOR', 'ADMINISTRADOR'] } 
  },
  {
    path: 'crrito',
    loadComponent: () => import('./features/crrito/crrito.page').then(m => m.CrritoPage),
    canActivate: [roleGuard],
    // 🔒 Ventas y carrito
    data: { expectedRoles: ['MOSTRADOR', 'ADMINISTRADOR'] } 
  },
  {
    path: 'orden',
    loadComponent: () => import('./features/orden/orden.page').then(m => m.OrdenPage),
    canActivate: [roleGuard],
    // 🔒 Todos ocupan gestionar órdenes (Mostrador crea, Caja cobra)
    data: { expectedRoles: ['MOSTRADOR', 'CAJA', 'CAJER@', 'ADMINISTRADOR'] } 
  },
  {
    path: 'optometrista', 
    loadComponent: () => import('./features/optometrista/optometrista.page').then(m => m.OptometristaPage),
    canActivate: [roleGuard],
    // 🔒 Optometristas y Administradores
    data: { expectedRoles: ['OPTOMETRISTA', 'ADMINISTRADOR'] } 
  },
  {
    path: 'operadores', 
    loadComponent: () => import('./features/operadores/operadores.page').then(m => m.OperadoresPage),
    canActivate: [roleGuard],
    // 🔒 Gestión exclusiva del administrador
    data: { expectedRoles: ['ADMINISTRADOR'] }
  },
  {
    path: 'reportes',
    loadComponent: () => import('./features/reportes/reporting-dashboard/reporting-dashboard.component').then(m => m.ReportingDashboardComponent),
    canActivate: [roleGuard],
    data: { expectedRoles: ['ADMINISTRADOR'] }
  },
  
  // ==========================================
  // RUTA DE PRUEBAS O LIBRES
  // ==========================================
  {
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [roleGuard],
    // 🔒 Dashboard Ejecutivo
    data: { expectedRoles: ['ADMINISTRADOR', 'MOSTRADOR', 'CAJA', 'OPTOMETRISTA'] }
  },
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
    path: '**', // 🚨 EL COMODÍN SIEMPRE DEBE IR AL FINAL DE TODO
    redirectTo: 'auth/login' 
  }
];