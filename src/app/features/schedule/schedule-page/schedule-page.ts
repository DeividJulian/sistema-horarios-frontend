import { Component, DestroyRef, inject, signal } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';
import { CatalogStore } from '../../../core/state/catalog.store';
import { AnalysisResult } from '../../../workers/schedule-analysis';
import { AnalysisPanel } from '../analysis-panel/analysis-panel';
import { EMPTY_FILTER, ScheduleFilter } from '../schedule-filter';
import { ScheduleFilters } from '../schedule-filters/schedule-filters';
import { EntryMove, ScheduleGrid } from '../schedule-grid/schedule-grid';

@Component({
  selector: 'app-schedule-page',
  imports: [ScheduleFilters, ScheduleGrid, AnalysisPanel],
  templateUrl: './schedule-page.html',
  styleUrl: './schedule-page.css',
})
export class SchedulePage {
  protected readonly store = inject(CatalogStore);
  private readonly notify = inject(NotificationService);

  protected readonly filter = signal<ScheduleFilter>(EMPTY_FILTER);
  protected readonly analysis = signal<AnalysisResult | null>(null);

  private readonly worker = this.createWorker();

  constructor() {
    this.reload();
    inject(DestroyRef).onDestroy(() => this.worker?.terminate());
  }

  protected generate(): void {
    this.store.generateSchedule().subscribe({
      next: (result) => {
        this.notify.success(`Horario generado: ${result.total_bloques} bloques sin cruces.`);
        this.reload();
      },
      error: (err) => this.notify.apiError(err, 'No se pudo generar el horario.'),
    });
  }

  /** The heavy analysis runs in a Web Worker so the page never freezes. */
  protected analyze(): void {
    if (!this.worker) {
      this.notify.error('Tu navegador no soporta Web Workers.');
      return;
    }
    this.worker.postMessage({
      entries: this.store.entries(),
      subjects: this.store.subjects(),
      teachers: this.store.teachers(),
      classrooms: this.store.classrooms(),
    });
  }

  protected move({ entry, day, hour }: EntryMove): void {
    this.store.moveEntry(entry, day, hour).subscribe({
      next: () => this.notify.success('Bloque movido.'),
      error: (err) => this.notify.apiError(err, 'No se pudo mover el bloque.'),
    });
  }

  protected occupiedDrop(): void {
    this.notify.info('Esa casilla ya está ocupada. Elige una casilla vacía.');
  }

  private reload(): void {
    this.store.load().subscribe({
      error: (err) => this.notify.apiError(err, 'No se pudieron cargar los datos.'),
    });
  }

  private createWorker(): Worker | null {
    if (typeof Worker === 'undefined') return null;
    const worker = new Worker(new URL('../../../workers/schedule-analysis.worker', import.meta.url));
    worker.onmessage = ({ data }: MessageEvent<AnalysisResult>) => this.analysis.set(data);
    return worker;
  }
}
