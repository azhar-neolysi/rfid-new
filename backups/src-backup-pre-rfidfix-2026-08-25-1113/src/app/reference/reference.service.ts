import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { Reference } from '../models/reference.model';

@Injectable({ providedIn: 'root' })
export class ReferenceService extends BaseService {
  addReference(data: any): Observable<Reference> {
    return this.post<Reference>('api/Reference', data);
  }

  getReference(): Observable<Reference[]> {
    return this.get<Reference[]>('api/Reference');
  }

  getReferenceById(id: number): Observable<Reference> {
    return this.get<Reference>(`api/Reference/${id}`);
  }

  updateReference(data: any): Observable<void> {
    return this.put<void>(`api/Reference/${data.referenceId}`, data);
  }

  deleteReference(id: number): Observable<void> {
    return this.delete<void>(`api/Reference/${id}`);
  }
}
