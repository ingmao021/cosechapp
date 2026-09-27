import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'change-password',
    loadComponent: () => import('./pages/change-password.page').then(m => m.ChangePasswordPage),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy.page').then(m => m.PrivacyPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];