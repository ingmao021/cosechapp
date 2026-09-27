import { Routes } from '@angular/router';

export const priceAndNewsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/price-news.page').then(m => m.PriceNewsPage),
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications.page').then(m => m.NotificationsPage),
  },
];