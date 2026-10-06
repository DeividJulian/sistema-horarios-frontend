import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AnalysisService } from '../../../core/api/analysis.service';
import { Conflict, Readiness, ScheduleEntry } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CatalogStore } from '../../../core/state/catalog.store';
import { AnalysisResult } from '../../../workers/schedule-analysis';
import { StateMessage } from '../../../shared/state-message/state-message';
import { CONFLICT_LABELS } from '../../analysis/conflict-labels';
import { AnalysisPanel } from '../analysis-panel/analysis-panel';
import { EMPTY_FILTER, ScheduleFilter } from '../schedule-filter';
import { ScheduleFilters } from '../schedule-filters/schedule-filters';
import { EntryDetails } from '../entry-details/entry-details';
import { GettingStarted } from '../getting-started/getting-started';
import { EntryMove, ScheduleGrid } from '../schedule-grid/schedule-grid';

@Component({
  selector: 'app-schedule-page',
  imports: [ScheduleFilters, ScheduleGrid, AnalysisPanel, StateMessage, RouterLink, EntryDetails, GettingStarted],
  templateUrl: './schedule-page.html',
  styleUrl: './schedule-page.css',
})
export class SchedulePage {
  protected readonly store = inject(CatalogStore);
  private readonly notify = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly analysisApi = inject(AnalysisService);

  protected readonly filter = signal<ScheduleFilter>(EMPTY_FILTER);
  protected readonly analysis = signal<AnalysisResult | null>(null);
  protected readonly conflicts = signal<Conflict[]>([]);
  protected readonly readiness = signal<Readiness | null>(null);

  protected readonly counts = computed(() => ({
    classrooms: this.store.classrooms().length,
    groups: this.store.groups().length,
    teachers: this.store.teachers().length,
    subjects: this.store.subjects().length,
    entries: this.store.entries().length,
  }));
  protected readonly selectedId = signal<number | null>(null);

  /** Block whose details are open; it disappears if the block is deleted or the data reloads without it. */
  protected readonly selectedEntry = computed(() => this.store.entries().find((e) => e.id === this.selectedId()) ?? null);

  /** "Type: description" per block, so the calendar can flag the blocks in trouble. */
  protected readonly conflictsByEntry = computed(() => {
    const map = new Map<number, string[]>();
    for (const c of this.conflicts()) {
      for (const id of c.horario_ids) {
        map.set(id, [...(map.get(id) ?? []), `${CONFLICT_LABELS[c.tipo]}: ${c.descripcion}`]);
      }
    }
    return map;
  });

  private readonly worker = this.createWorker();

  constructor() {
    this.reload();
    inject(DestroyRef).onDestroy(() => this.worker?.terminate());
  }

  protected async generate(): Promise<void> {
    if (this.store.entries().length > 0) {
      const accepted = await this.confirm.ask({
        title: '¿Generar un horario nuevo?',
        message: 'El horario actual se reemplazará por completo, incluidos los bloques que hayas movido a mano.',
        confirmText: 'Generar horario',
      });
      if (!accepted) return;
    }

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
      next: () => {
        this.notify.success('Bloque movido.');
        this.refreshConflicts();
      },
      error: (err) => this.notify.apiError(err, 'No se pudo mover el bloque.'),
    });
  }

  protected async deleteEntry(entry: ScheduleEntry): Promise<void> {
    const name = this.store.subjectsById().get(entry.materia_id)?.nombre ?? 'este bloque';
    const accepted = await this.confirm.ask({
      title: '¿Eliminar este bloque?',
      message: `Se quitará la clase de ${name} del ${entry.dia_semana}. La materia quedará con horas sin programar hasta que generes el horario de nuevo.`,
      confirmText: 'Eliminar bloque',
      danger: true,
    });
    if (!accepted) return;
    this.store.deleteEntry(entry.id).subscribe({
      next: () => {
        this.notify.success('Bloque eliminado.');
        this.selectedId.set(null);
        this.refreshConflicts();
      },
      error: (err) => this.notify.apiError(err, 'No se pudo eliminar el bloque.'),
    });
  }

  protected occupiedDrop(): void {
    this.notify.info('Esa casilla ya está ocupada. Elige una casilla vacía.');
  }

  protected reload(): void {
    this.store.load().subscribe({
      next: () => this.refreshConflicts(),
      error: (err) => this.notify.apiError(err, 'No se pudieron cargar los datos.'),
    });
  }

  /** Conflicts and readiness are computed by the backend; a failure here is not critical, so it is silent. */
  private refreshConflicts(): void {
    this.analysisApi.conflicts().subscribe({
      next: (report) => this.conflicts.set(report.conflictos),
      error: () => this.conflicts.set([]),
    });
    this.analysisApi.readiness().subscribe({
      next: (readiness) => this.readiness.set(readiness),
      error: () => this.readiness.set(null),
    });
  }

  private createWorker(): Worker | null {
    if (typeof Worker === 'undefined') return null;
    const worker = new Worker(new URL('../../../workers/schedule-analysis.worker', import.meta.url));
    worker.onmessage = ({ data }: MessageEvent<AnalysisResult>) => this.analysis.set(data);
    return worker;
  }
}
