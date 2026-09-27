import { Routes } from '@angular/router';

export const workerRoutes: Routes = [
  {
    path: 'catalog',
    loadComponent: () => import('./pages/worker-catalog.page').then(m => m.WorkerCatalogPage),
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/worker-form.page').then(m => m.WorkerFormPage),
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./pages/worker-form.page').then(m => m.WorkerFormPage),
  },
  {
    path: '',
    redirectTo: 'catalog',
    pathMatch: 'full',
  },
];