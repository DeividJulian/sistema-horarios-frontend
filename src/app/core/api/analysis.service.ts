import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ConflictReport, SeedResult, Statistics } from '../models';
import { API_URL } from './api-url';

/** demo: small example. facultad: 8 semesters of Software Engineering with their shifts. */
export type SeedDataset = 'demo' | 'facultad';

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly http = inject(HttpClient);

  statistics(): Observable<Statistics> {
    return this.http.get<Statistics>(`${API_URL}/estadisticas`);
  }

  conflicts(): Observable<ConflictReport> {
    return this.http.get<ConflictReport>(`${API_URL}/conflictos`);
  }

  /** Loads demo data. With reset=true the backend first DELETES every record. */
  seed(dataset: SeedDataset = 'demo', reset = false): Observable<SeedResult> {
    let params = new HttpParams().set('dataset', dataset);
    if (reset) params = params.set('reiniciar', 'true');
    return this.http.post<SeedResult>(`${API_URL}/seed`, {}, { params });
  }
}
