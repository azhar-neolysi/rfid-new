import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BaseService {
  constructor(protected http: HttpClient) {}

  protected get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${environment.baseUrl}${path}`);
  }

  protected post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${environment.baseUrl}${path}`, body);
  }

  protected put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${environment.baseUrl}${path}`, body);
  }

  protected delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${environment.baseUrl}${path}`);
  }
}
