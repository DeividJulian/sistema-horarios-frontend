import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AvailabilityService } from '../../../core/api/availability.service';
import { Availability, Teacher, WEEKDAYS, Weekday, hourOf, toApiTime } from '../../../core/models';
import { NotificationService } from '../../../core/services/notification.service';
import { formErrorMessage } from '../../../shared/forms/error-message';
import { MAX_HOUR, MIN_HOUR, hourRange } from '../../../shared/forms/validators';

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

@Component({
  selector: 'app-availability-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './availability-panel.html',
  styleUrl: './availability-panel.css',
})
export class AvailabilityPanel {
  readonly teacher = input.required<Teacher>();
  readonly closed = output<void>();

  private readonly api = inject(AvailabilityService);
  private readonly notify = inject(NotificationService);

  protected readonly weekdays = WEEKDAYS;
  protected readonly startHours = range(MIN_HOUR, MAX_HOUR - 1);
  protected readonly endHours = range(MIN_HOUR + 1, MAX_HOUR);
  protected readonly hourOf = hourOf;
  protected readonly formErrorMessage = formErrorMessage;

  protected readonly slots = signal<Availability[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

  protected readonly sortedSlots = computed(() =>
    [...this.slots()].sort(
      (a, b) => WEEKDAYS.indexOf(a.dia_semana) - WEEKDAYS.indexOf(b.dia_semana) || hourOf(a.hora_inicio) - hourOf(b.hora_inicio),
    ),
  );

  /** Total available hours per week; the generator can only place classes inside them. */
  protected readonly weeklyHours = computed(() =>
    this.slots().reduce((sum, s) => sum + hourOf(s.hora_fin) - hourOf(s.hora_inicio), 0),
  );

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      dia_semana: ['Lunes' as Weekday, Validators.required],
      start: [8, Validators.required],
      end: [10, Validators.required],
    },
    { validators: hourRange('start', 'end') },
  );

  constructor() {
    // Reload the list every time a different teacher is selected
    effect(() => {
      const teacher = this.teacher();
      untracked(() => this.load(teacher.id));
    });
  }

  protected add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { dia_semana, start, end } = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .create({ profesor_id: this.teacher().id, dia_semana, hora_inicio: toApiTime(Number(start)), hora_fin: toApiTime(Number(end)) })
      .subscribe({
        next: (created) => {
          this.slots.update((list) => [...list, created]);
          this.notify.success(`Disponibilidad agregada: ${dia_semana} de ${start}:00 a ${end}:00.`);
          this.saving.set(false);
        },
        error: (err) => {
          this.notify.apiError(err, 'No se pudo agregar la disponibilidad.');
          this.saving.set(false);
        },
      });
  }

  protected remove(slot: Availability): void {
    this.api.delete(slot.id).subscribe({
      next: () => {
        this.slots.update((list) => list.filter((s) => s.id !== slot.id));
        this.notify.success('Franja de disponibilidad eliminada.');
      },
      error: (err) => this.notify.apiError(err, 'No se pudo eliminar la franja.'),
    });
  }

  private load(teacherId: number): void {
    this.loading.set(true);
    this.api.listByTeacher(teacherId).subscribe({
      next: (list) => {
        this.slots.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.notify.apiError(err, 'No se pudo cargar la disponibilidad.');
        this.loading.set(false);
      },
    });
  }
}
