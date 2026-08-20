import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { DeviceMaster } from '../models/device-master.model';

@Injectable({ providedIn: 'root' })
export class DevicemasterService extends BaseService {
  addDevice(data: any): Observable<DeviceMaster> {
    return this.post<DeviceMaster>('api/DeviceMaster', data);
  }

  editDevice(data: any): Observable<void> {
    return this.put<void>(`api/DeviceMaster/${data.deviceMasterId}`, data);
  }

  getDevices(): Observable<DeviceMaster[]> {
    return this.get<DeviceMaster[]>('api/DeviceMaster');
  }

  getDevice(id: number): Observable<DeviceMaster> {
    return this.get<DeviceMaster>(`api/DeviceMaster/${id}`);
  }

  deleteDevice(id: number): Observable<void> {
    return this.delete<void>(`api/DeviceMaster/${id}`);
  }
}
