import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TutorialService } from '../../core/services/tutorial.service';

interface NavItem {
  path: string;
  label: string;
}

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css',
})
export class NavBar {
  protected readonly tutorial = inject(TutorialService);

  protected readonly items: NavItem[] = [
    { path: '/horario', label: 'Horario' },
    { path: '/gestion', label: 'Gestión' },
    { path: '/analisis', label: 'Análisis' },
  ];
}
