import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AnalysisService } from '../../../core/api/analysis.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { ConflictReport, Statistics } from '../../../core/models';
import { TabSyncService } from '../../../core/services/tab-sync.service';
import { BarItem, BarList } from '../../../shared/bar-list/bar-list';
import { StateMessage } from '../../../shared/state-message/state-message';
import { CONFLICT_LABELS } from '../conflict-labels';

const percent = (value: number) => `${value.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;

@Component({
  selector: 'app-analysis-page',
  imports: [BarList, StateMessage, DecimalPipe],
  templateUrl: './analysis-page.html',
  styleUrl: './analysis-page.css',
})
export class AnalysisPage {
  private readonly api = inject(AnalysisService);
  private readonly tabSync = inject(TabSyncService);

  protected readonly stats = signal<Statistics | null>(null);
  protected readonly report = signal<ConflictReport | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly labels = CONFLICT_LABELS;

  protected readonly classroomBars = computed<BarItem[]>(() =>
    (this.stats()?.ocupacion_aulas ?? []).map((c) => ({
      label: c.aula,
      value: c.ocupacion_pct,
      display: `${c.horas_ocupadas} h · ${percent(c.ocupacion_pct)}`,
    })),
  );

  protected readonly dayBars = computed<BarItem[]>(() =>
    (this.stats()?.distribucion_por_dia ?? []).map((d) => ({
      label: d.dia,
      value: d.bloques,
      display: `${d.bloques} ${d.bloques === 1 ? 'bloque' : 'bloques'}`,
    })),
  );

  protected readonly totalIdleHours = computed(() =>
    (this.stats()?.carga_profesores ?? []).reduce((sum, t) => sum + t.franjas_muertas, 0),
  );

  constructor() {
    // Refresh when another tab changes the schedule (and once at start, when the counter is 0)
    effect(() => {
      this.tabSync.remoteChanges();
      untracked(() => this.refresh());
    });
  }

  protected refresh(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ stats: this.api.statistics(), report: this.api.conflicts() }).subscribe({
      next: ({ stats, report }) => {
        this.stats.set(stats);
        this.report.set(report);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiErrorMessage(err, 'No se pudo cargar el análisis.'));
        this.loading.set(false);
      },
    });
  }
}
