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
  { path: '**', redirectTo: 'horario' },
];
