import { Routes } from '@angular/router';

export const routes: Routes = [
  // Splash: página de arranque que verifica sesión y navega a home o login.
  // Ruta propia: si compartiera path '' con el layout de tabs, ion-router-outlet no la
  // retira al navegar a /home y la animación queda encima de Inicio.
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'splash',
  },
  {
    path: 'splash',
    loadComponent: () => import('./auth/pages/splash.page').then(m => m.SplashPage),
  },
  // Autenticación (login/registro) — fuera de tabs
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes),
  },
  // Catálogo de trabajadores — fuera de tabs (acceso desde Perfil)
  {
    path: 'worker',
    loadChildren: () => import('./worker/worker.routes').then(m => m.workerRoutes),
  },
  // Precio y Noticias — fuera de tabs (acceso desde notificaciones)
  {
    path: 'price-and-news',
    loadChildren: () => import('./price-and-news/price-and-news.routes').then(m => m.priceAndNewsRoutes),
  },
  // App principal con tabs — solo accesible si hay sesión válida
  {
    path: '',
    loadComponent: () => import('./core/layout/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./harvest/pages/home.page').then(m => m.HomePage),
      },
      {
        path: 'price-news',
        loadComponent: () => import('./price-and-news/pages/price-news.page').then(m => m.PriceNewsPage),
      },
      {
        path: 'history',
        loadComponent: () => import('./harvest/pages/history.page').then(m => m.HistoryPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./auth/pages/profile.page').then(m => m.ProfilePage),
      },
      // Rutas de cosecha (hijas de tabs para mantener navegación inferior)
      {
        path: 'harvest',
        loadChildren: () => import('./harvest/harvest.routes').then(m => m.harvestRoutes),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  // Wildcard: redirigir a splash (que verificará sesión y navegará apropiadamente)
  {
    path: '**',
    redirectTo: '',
  },
];