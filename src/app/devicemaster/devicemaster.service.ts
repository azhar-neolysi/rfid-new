import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class DevicemasterService {
  constructor(private http: HttpClient) {}
  addDevice(data: any) {
    return this.http.post(environment.baseUrl + `DeviceMaster`, data);
  }
  editDevice(data: any) {
    return this.http.put(environment.baseUrl + `DeviceMaster/${data.deviceMasterId}`, data);
  }
  getDevices() {
    return this.http.get(environment.baseUrl + `DeviceMaster`);
  }
  getDevice(id: any) {
    return this.http.get(environment.baseUrl + `DeviceMaster/${id}`);
  }
  deleteDevice(id: any) {
    return this.http.delete(environment.baseUrl + `DeviceMaster/${id}`);
  }
}
