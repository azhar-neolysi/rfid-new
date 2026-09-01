import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { Rfidmaster } from '../models/rfid-master.model';

@Injectable({ providedIn: 'root' })
export class RfidService extends BaseService {
  addRFID(data: any): Observable<Rfidmaster> {
    return this.post<Rfidmaster>('api/Rfidmaster', data);
  }

  updateRFID(data: any): Observable<void> {
    return this.put<void>(`api/Rfidmaster/${data.rfidmasterId}`, data);
  }

  deleteRFID(id: number): Observable<void> {
    return this.delete<void>(`api/Rfidmaster/${id}`);
  }

  getRFIDs(): Observable<Rfidmaster[]> {
    return this.get<Rfidmaster[]>('api/Rfidmaster');
  }

  getRFID(id: number): Observable<Rfidmaster> {
    return this.get<Rfidmaster>(`api/Rfidmaster/${id}`);
  }
}
