# Óptica HL — Aplicación Frontend & Móvil

Interfaz de usuario multiplataforma (Web & Móvil) para la gestión operativa y clínica de **Óptica HL**. Esta aplicación está construida sobre el ecosistema de **Angular**, potenciada con los componentes de interfaz de usuario de **Ionic Framework** y empaquetada para capacidades híbridas nativas mediante **Capacitor**.

---

## 📌 Tabla de Contenidos

* [Descripción General](#-descripción-general)
* [Stack Tecnológico](#-stack-tecnológico)
* [Estructura del Proyecto](#-estructura-del-proyecto)
* [Módulos y Características](#-módulos-y-características)
* [Componentes y Servicios Destacados](#-componentes-y-servicios-destacados)
* [Requisitos Previos](#-requisitos-previos)
* [Instalación y Configuración](#-instalación-y-configuración)
* [Configuración de Entornos](#-configuración-de-entornos)
* [Ejecución y Compilación](#-ejecución-y-compilación)
* [Integración Móvil (Capacitor)](#-integración-móvil-capacitor)
* [Pipeline de CI/CD](#-pipeline-de-cicd)
* [Convenciones y Buenas Prácticas](#-convenciones-y-buenas-prácticas)

---

## 📖 Descripción General

La aplicación cliente de **Óptica HL** centraliza todos los puntos de interacción de las clínicas ópticas en una sola plataforma responsiva y adaptada a dispositivos móviles o terminales de punto de venta (POS).

Entre sus principales funciones se encuentran:
1. **Atención en Mostrador & Punto de Venta (POS):** Carrito de ventas rápido, cobro con múltiples formas de pago, emisión de comprobantes y control de turnos de caja.
2. **Módulo Clínico (Optometría & Refracción):** Registro de exámenes optométricos, graduación visual, emisión de recetas y seguimiento de historias clínicas.
3. **Gestión de Inventario & Etiquetado:** Consulta de armazones y suministros, alertas de stock crítico e impresión directa de etiquetas térmicas (impresoras Zebra).
4. **Facturación Fiscal:** Asistente modal para timbrado y consulta de comprobantes fiscales (CFDI).
5. **Dashboard Analítico:** Métricas de rendimiento, gráficos de ventas y monitoreo de sucursales.

---

## 🛠 Stack Tecnológico

* **Framework Principal:** [Angular](https://angular.io/) (TypeScript, SCSS)
* **Librería UI / Móvil:** [Ionic Framework](https://ionicframework.com/) (Componentes híbridos iOS / Android / Web)
* **Runtime Móvil:** [Capacitor](https://capacitorjs.com/) (`capacitor.config.ts`)
* **Gestión de Estado y Reactividad:** RxJS
* **Linter y Formateo:** ESLint (`eslint.config.mjs`)
* **Testing:** Karma & Jasmine (`karma.conf.js`, `tsconfig.spec.json`)
* **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)

---

## 📂 Estructura del Proyecto

El código fuente se encuentra estructurado bajo una arquitectura modular y escalable dentro del directorio `src/app/`:

```
OpticaHL-Frontend/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Pipeline de compilación y despliegue
├── src/
│   ├── app/
│   │   ├── core/                 # Elementos singleton, servicios y seguridad central
│   │   │   ├── auth/
│   │   │   │   ├── guard/        # auth.guard.ts, role.guard.ts
│   │   │   │   └── interceptors/ # token.interceptor.ts
│   │   │   └── services/         # Servicios de comunicación HTTP con la API Backend
│   │   │       ├── articulos.service.ts
│   │   │       ├── auth.service.ts
│   │   │       ├── caja.service.ts
│   │   │       ├── cart.service.ts
│   │   │       ├── cliente.service.ts
│   │   │       ├── dashboard.service.ts
│   │   │       ├── descuento.service.ts
│   │   │       ├── facturacion.service.ts
│   │   │       ├── impresora-zebra.service.ts
│   │   │       ├── inventario.service.ts
│   │   │       ├── operadores.service.ts
│   │   │       ├── orden.service.ts
│   │   │       ├── proveedores.service.ts
│   │   │       ├── report-filter.service.ts
│   │   │       ├── reporte.service.ts
│   │   │       ├── soporte.service.ts
│   │   │       └── sucursales.service.ts
│   │   ├── features/             # Vistas de negocio y páginas principales (Ionic Pages)
│   │   │   ├── caja/             # Flujo de apertura y operaciones de caja
│   │   │   ├── cortecaja/        # Cierres de caja y arqueos
│   │   │   ├── crrito/           # Carrito de compras y checkout
│   │   │   ├── dashboard/        # Métricas, KPIs y gráficos de venta
│   │   │   ├── descuento/        # Administración de promociones y descuentos
│   │   │   ├── facturacion/      # Consulta y emisión de facturación
│   │   │   ├── inventario/       # Catálogo de existencias y productos
│   │   │   ├── login/            # Autenticación de operadores
│   │   │   ├── mostrador/        # Terminal de punto de venta (POS)
│   │   │   ├── operadores/       # Gestión de personal y cuentas
│   │   │   ├── optometrista/     # Panel del especialista clínico
│   │   │   ├── refraccion/       # Formularios de examen visual
│   │   │   └── sucursales/       # Administración de sedes físicas
│   │   ├── layouts/              # Estructuras de layout (ej. auth-layout)
│   │   ├── shared/               # Componentes reutilizables, modales e interfaces
│   │   │   ├── components/       # Modales (cobro, pago, facturación, Zebra, etc.)
│   │   │   └── interfaces/       # Modelos tipados de TypeScript
│   │   ├── app.component.ts      # Componente raíz
│   │   └── app.routes.ts         # Tabla de enrutamiento principal
│   ├── assets/                   # Recursos estáticos (logos, iconos, formas SVG)
│   ├── environments/             # Configuraciones por entorno (dev / prod)
│   ├── theme/                    # Paleta y variables globales de estilo Ionic
│   ├── global.scss               # Estilos globales de la aplicación
│   └── index.html                # Documento HTML base
├── angular.json                  # Configuración de compilación de Angular
├── capacitor.config.ts           # Configuración de empaquetado móvil Capacitor
├── ionic.config.json             # Configuración del CLI de Ionic
└── package.json                  # Dependencias y scripts de ejecución
```

---

## 🧩 Módulos y Características

| Módulo / Vista | Ruta Sugerida | Propósito Operativo |
| :--- | :--- | :--- |
| **Login** | `/login` | Acceso con credenciales para operadores y médicos. |
| **Mostrador & Carrito** | `/mostrador`, `/crrito` | Registro ágil de ventas, búsqueda de artículos y flujo de pago. |
| **Caja & Cortes** | `/caja`, `/cortecaja` | Aperturas de turno, arqueo de fondos y cierre contable diario. |
| **Clínica & Refracción** | `/optometrista`, `/refraccion` | Diagnóstico refractivo, graduación de micas y recetas. |
| **Inventario** | `/inventario` | Monitoreo de armazones, lentes de contacto y control de existencias. |
| **Facturación** | `/facturacion` | Solicitud y visualización de CFDI asociados a ventas. |
| **Dashboard** | `/dashboard` | Resumen de desempeño con visualización de gráficas de venta. |
| **Operadores & Sucursales**| `/operadores`, `/sucursales` | Mantenimiento de personal operativo y sucursales. |

---

## ⚙️ Componentes y Servicios Destacados

* **`ImpresoraZebraService`:** Soporte e integración directa con impresoras de etiquetas de códigos de barras / etiquetas ópticas (`ZPL`).
* **`TokenInterceptor`:** Middleware HTTP en Angular que inyecta automáticamente el token JWT en las cabeceras `Authorization: Bearer <token>` dirigidas al backend.
* **`AuthGuard` & `RoleGuard`:** Protección de rutas basada en el estado de autenticación y los privilegios asignados al perfil del usuario.
* **Componentes Modales Reutilizables:**
  * `modalcobrorapido`: Flujo directo de cobro para terminales POS.
  * `modal-pago`: Configuración de transacciones mixtas (efectivo, tarjeta, transferencias).
  * `modal-facturacion`: Captura de datos fiscales de clientes (RFC, régimen, uso de CFDI).
  * `impresion-etiquetas`: Interfaz de selección de códigos y plantillas para impresión física.

---

## 📋 Requisitos Previos

* **Node.js:** Versión `>= 18.x`
* **npm:** Versión `>= 9.x`
* **Angular CLI:** `npm install -g @angular/cli`
* **Ionic CLI:** `npm install -g @ionic/cli`
* **Android Studio / Xcode:** (Opcional, únicamente requerido para emular o compilar plataformas nativas iOS/Android).

---

## 🚀 Instalación y Configuración

1. **Clonar el proyecto:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd OpticaHL-Frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Verificar la configuración de variables de entorno:**
   Revisar los archivos dentro de `src/environments/`:
   * `environment.ts` (desarrollo)
   * `environment.prod.ts` (producción)

---

## 🌐 Configuración de Entornos

Asegúrese de vincular la URL del backend correspondiente en cada archivo de entorno:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api' // URL de tu OpticaHL-Backend
};
```

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio-opticahl.com/api'
};
```

---

## 💻 Ejecución y Compilación

### Servidor de Desarrollo Local
Para levantar el servidor de desarrollo en el navegador:
```bash
# Mediante el CLI de Ionic (recomendado para probar componentes móviles)
ionic serve

# O directamente con Angular CLI
npm start
```
La aplicación estará disponible por defecto en `http://localhost:8100/` o `http://localhost:4200/`.

### Ejecutar Pruebas Unitarias
```bash
npm run test
```

### Compilar para Producción (Web)
```bash
npm run build
```
Los archivos optimizados resultantes se generarán en la carpeta `dist/`.

---

## 📱 Integración Móvil (Capacitor)

Para compilar la aplicación como APK de Android o paquete de iOS:

1. **Compilar el build web:**
   ```bash
   npm run build
   ```

2. **Sincronizar los cambios con las plataformas nativas:**
   ```bash
   npx cap sync
   ```

3. **Abrir el entorno nativo:**
   ```bash
   # Para Android
   npx cap open android

   # Para iOS
   npx cap open ios
   ```

---

## 🔄 Pipeline de CI/CD

El repositorio cuenta con integración continua configurada en `.github/workflows/deploy.yml`. 

Al subir cambios a la rama principal (`main` o `master`), el pipeline automatiza:
1. Instalación determinista de dependencias (`npm ci`).
2. Validación de estándares y análisis estático mediante ESLint.
3. Compilación del proyecto (`ng build --configuration=production`).
4. Despliegue hacia el servidor web, bucket S3 o plataforma de hosting configurada.

---

## 🛡️ Convenciones y Buenas Prácticas

* **Consumo de API Centralizado:** Ningún componente debe realizar peticiones HTTP directamente; todas las llamadas deben pasar a través de los servicios ubicados en `src/app/core/services/`.
* **Manejo de Formularios Reactivos:** Las pantallas de captura de recetas, datos de clientes y productos deben basarse en `ReactiveFormsModule` para validaciones estrictas antes del envío.
* **Destrucción de Suscripciones:** En componentes que escuchen Observables de RxJS, emplear operadores de terminación (`takeUntilDestroyed` o `Subject` de desuscripción) para prevenir fugas de memoria.
