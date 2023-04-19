import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class RfidService {
  constructor(private http: HttpClient) {}
  addRFID(data: any) {
    return this.http.post(environment.baseUrl + `Rfidmaster`, data);
  }
  updateRFID(data: any) {
    return this.http.put(environment.baseUrl + `Rfidmaster/${data.rfidmasterId}`, data);
  }
  deleteRFID(id: any) {
    return this.http.delete(environment.baseUrl + `Rfidmaster/${id}`);
  }
  getRFIDs() {
    return this.http.get(environment.baseUrl + `Rfidmaster`);
  }
  getRFID(id: any) {
    return this.http.get(environment.baseUrl + `Rfidmaster/${id}`);
  }
}
