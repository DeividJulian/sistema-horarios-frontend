import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, forkJoin, tap } from 'rxjs';

import { ClassroomService } from '../api/classroom.service';
import { ScheduleService } from '../api/schedule.service';
import { StudentGroupService } from '../api/student-group.service';
import { SubjectService } from '../api/subject.service';
import { TeacherService } from '../api/teacher.service';
import {
  Classroom,
  GenerationResult,
  ScheduleEntry,
  StudentGroup,
  Subject,
  Teacher,
  Weekday,
  toApiTime,
} from '../models';

const byId = <T extends { id: number }>(items: T[]) => new Map(items.map((item) => [item.id, item]));

/**
 * Single source of truth for the data every page shares (teachers, classrooms, groups,
 * subjects and schedule blocks). Components read signals; changes go through these methods.
 */
@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly teacherApi = inject(TeacherService);
  private readonly classroomApi = inject(ClassroomService);
  private readonly groupApi = inject(StudentGroupService);
  private readonly subjectApi = inject(SubjectService);
  private readonly scheduleApi = inject(ScheduleService);

  readonly teachers = signal<Teacher[]>([]);
  readonly classrooms = signal<Classroom[]>([]);
  readonly groups = signal<StudentGroup[]>([]);
  readonly subjects = signal<Subject[]>([]);
  readonly entries = signal<ScheduleEntry[]>([]);

  readonly loading = signal(false);
  readonly loaded = signal(false);

  readonly teachersById = computed(() => byId(this.teachers()));
  readonly classroomsById = computed(() => byId(this.classrooms()));
  readonly groupsById = computed(() => byId(this.groups()));
  readonly subjectsById = computed(() => byId(this.subjects()));

  load(): Observable<unknown> {
    this.loading.set(true);
    return forkJoin({
      teachers: this.teacherApi.list(),
      classrooms: this.classroomApi.list(),
      groups: this.groupApi.list(),
      subjects: this.subjectApi.list(),
      entries: this.scheduleApi.list(),
    }).pipe(
      tap((data) => {
        this.teachers.set(data.teachers);
        this.classrooms.set(data.classrooms);
        this.groups.set(data.groups);
        this.subjects.set(data.subjects);
        this.entries.set(data.entries);
        this.loaded.set(true);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  generateSchedule(): Observable<GenerationResult> {
    return this.scheduleApi.generate();
  }

  /** Moves a block right away (optimistic update) and rolls back if the backend rejects it. */
  moveEntry(entry: ScheduleEntry, day: Weekday, hour: number): Observable<ScheduleEntry> {
    const previous = { ...entry };
    const start = toApiTime(hour);
    this.replaceEntry({ ...entry, dia_semana: day, hora_inicio: start, hora_fin: toApiTime(hour + 1) });

    return this.scheduleApi.move(entry.id, { dia_semana: day, hora_inicio: start }).pipe(
      tap({
        next: (saved) => this.replaceEntry(saved),
        error: () => this.replaceEntry(previous),
      }),
    );
  }

  private replaceEntry(updated: ScheduleEntry): void {
    this.entries.update((list) => list.map((e) => (e.id === updated.id ? updated : e)));
  }
}
