import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { ReferenceList } from '../models/reference-list.model';

@Injectable({ providedIn: 'root' })
export class ReferenceListService extends BaseService {
  addReferenceList(data: any): Observable<ReferenceList> {
    return this.post<ReferenceList>('api/ReferenceList', data);
  }

  updateReferenceList(data: any): Observable<void> {
    return this.put<void>(`api/ReferenceList/${data.referenceListId}`, data);
  }

  getReferenceList(): Observable<ReferenceList[]> {
    return this.get<ReferenceList[]>('api/ReferenceList');
  }

  getReferenceListId(id: number): Observable<ReferenceList> {
    return this.get<ReferenceList>(`api/ReferenceList/${id}`);
  }

  getReferenceListbyName(name: string): Observable<ReferenceList[]> {
    return this.get<ReferenceList[]>(`api/ReferenceList/GetRLByRLName?name=${name}`);
  }

  getReferenceListbyRefName(name: string): Observable<ReferenceList[]> {
    return this.get<ReferenceList[]>(`api/ReferenceList/GetRLByRName?name=${name}`);
  }

  deleteReferenceList(id: number): Observable<void> {
    return this.delete<void>(`api/ReferenceList/${id}`);
  }
}
