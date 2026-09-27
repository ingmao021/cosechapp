import { Routes } from '@angular/router';

export const harvestRoutes: Routes = [
  {
    path: 'open',
    loadComponent: () => import('./pages/open-harvest.page').then(m => m.OpenHarvestPage),
  },
  {
    path: 'crews',
    loadComponent: () => import('./pages/crews.page').then(m => m.CrewsPage),
  },
  {
    path: 'crews/:crewId',
    loadComponent: () => import('./pages/crew-detail.page').then(m => m.CrewDetailPage),
  },
  {
    path: 'pickers/:pickerId',
    loadComponent: () => import('./pages/picker-detail.page').then(m => m.PickerDetailPage),
  },
  {
    path: 'pickers/:pickerId/weighing/new',
    loadComponent: () => import('./pages/weighing-form.page').then(m => m.WeighingFormPage),
  },
  {
    path: 'close',
    loadComponent: () => import('./pages/harvest-close.page').then(m => m.HarvestClosePage),
  },
  {
    path: 'history/:harvestId',
    loadComponent: () => import('./pages/harvest-history-detail.page').then(m => m.HarvestHistoryDetailPage),
  },
];