import { Component, effect, inject, untracked } from '@angular/core';

import { TabSyncService } from './core/services/tab-sync.service';
import { CatalogStore } from './core/state/catalog.store';
import { SchedulePage } from './features/schedule/schedule-page/schedule-page';
import { ConnectionStatus } from './shared/connection-status/connection-status';

@Component({
  selector: 'app-root',
  imports: [SchedulePage, ConnectionStatus],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly store = inject(CatalogStore);
  private readonly tabSync = inject(TabSyncService);

  constructor() {
    // When another tab changes the schedule (Shared Worker message), this tab reloads the data
    effect(() => {
      if (this.tabSync.remoteChanges() > 0) {
        untracked(() => this.store.load().subscribe());
      }
    });
  }
}
