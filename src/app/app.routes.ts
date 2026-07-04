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
    data: { roles: ['ADMINISTRADOR'] } // 🔒 Solo administradores
  },
  {
    path: 'caja',
    loadComponent: () => import('./features/caja/caja.page').then(m => m.CajaPage),
    canActivate: [roleGuard],
    data: { roles: ['CAJA', 'ADMINISTRADOR'] } // 🔒 Cajeros y administradores
  },
  {
    path: 'cortecaja',
    loadComponent: () => import('./features/cortecaja/cortecaja.page').then(m => m.CorteCajaPage),
    canActivate: [roleGuard],
    data: { roles: ['CAJA', 'ADMINISTRADOR'] } // 🔒 Cajeros y administradores
  },
  {
    path: 'mostrador',
    loadComponent: () => import('./features/mostrador/mostrador.page').then(m => m.MostradorPage),
    canActivate: [roleGuard],
    data: { roles: ['MOSTRADOR', 'ADMINISTRADOR'] } // 🔒 ¡Aquí entra tu usuario de mostrador!
  },
  {
    path: 'crrito',
    loadComponent: () => import('./features/crrito/crrito.page').then(m => m.CrritoPage),
    canActivate: [roleGuard],
    data: { roles: ['MOSTRADOR', 'ADMINISTRADOR'] } // 🔒 Ventas y carrito
  },
  {
    path: 'orden',
    loadComponent: () => import('./features/orden/orden.page').then(m => m.OrdenPage),
    canActivate: [roleGuard],
    data: { roles: ['MOSTRADOR', 'CAJA', 'ADMINISTRADOR'] } // 🔒 Todos ocupan gestionar órdenes
  },
  {
    path: 'optometrista', // 🎯 ¡MOVIDA AQUÍ ARRIBA Y PROTEGIDA!
    loadComponent: () => import('./features/optometrista/optometrista.page').then(m => m.OptometristaPage),
    canActivate: [roleGuard],
    data: { roles: ['OPTOMETRISTA', 'ADMINISTRADOR'] } // 🔒 Optometristas y Administradores
  },
  {
    path: 'operadores', // 🎯 Movida aquí arriba también
    loadComponent: () => import('./features/operadores/operadores.page').then(m => m.OperadoresPage),
    canActivate: [roleGuard],
    data: { roles: ['ADMINISTRADOR'] }
  },
  
  // ==========================================
  // RUTA DE PRUEBAS O LIBRES
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
    path: '**', // 🚨 EL COMODÍN SIEMPRE DEBE IR AL FINAL DE TODO
    redirectTo: 'auth/login' 
  }
];