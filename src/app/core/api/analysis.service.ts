import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ConflictReport, SeedResult, Statistics } from '../models';
import { API_URL } from './api-url';

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly http = inject(HttpClient);

  statistics(): Observable<Statistics> {
    return this.http.get<Statistics>(`${API_URL}/estadisticas`);
  }

  conflicts(): Observable<ConflictReport> {
    return this.http.get<ConflictReport>(`${API_URL}/conflictos`);
  }

  /** Loads the demo data. With reset=true the backend first DELETES every record. */
  seed(reset = false): Observable<SeedResult> {
    const params = reset ? new HttpParams().set('reiniciar', 'true') : undefined;
    return this.http.post<SeedResult>(`${API_URL}/seed`, {}, { params });
  }
}
