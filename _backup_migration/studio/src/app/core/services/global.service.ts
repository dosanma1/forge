import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: string;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/global';

  listRecent(): Observable<RecentProject[]> {
    return this.http.get<RecentProject[]>(`${this.apiUrl}/recent`);
  }

  openProject(path: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/open`, { path });
  }

  createProject(path: string, name: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/create`, { path, name });
  }
}
