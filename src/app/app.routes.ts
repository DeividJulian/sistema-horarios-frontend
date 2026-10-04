import { Routes } from '@angular/router';

// Paths are what the user sees in the address bar, so they are in Spanish.
// Every page is lazy loaded: its code is only downloaded when the user opens it.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'horario' },
  {
    path: 'horario',
    title: 'Horario',
    loadComponent: () => import('./features/schedule/schedule-page/schedule-page').then((m) => m.SchedulePage),
  },
  {
    path: 'gestion',
    title: 'Gestión',
    loadComponent: () => import('./features/management/management-page/management-page').then((m) => m.ManagementPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profesores' },
      {
        path: 'profesores',
        title: 'Profesores',
        loadComponent: () => import('./features/management/teachers-section/teachers-section').then((m) => m.TeachersSection),
      },
    ],
  },
  { path: '**', redirectTo: 'horario' },
];
