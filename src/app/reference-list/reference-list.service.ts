import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ReferenceListService {
  constructor(private http: HttpClient) {}
  addReferenceList(data: any) {
    return this.http.post(environment.baseUrl + `ReferenceList`, data);
  }
  updateReferenceList(data: any) {
    return this.http.put(
      environment.baseUrl + `ReferenceList/${data.refReferenceId}`,
      data
    );
  }
  getReferenceList() {
    return this.http.get(environment.baseUrl + `ReferenceList`);
  }
  getReferenceListId(id: any) {
    return this.http.get(environment.baseUrl + `ReferenceList/${id}`);
  }
  getReferenceListbyRefName(name: any) {
    return this.http.get(
      environment.baseUrl + `ReferenceList/GetRLByRName?name=${name}`
    );
    // https://cloud.neolysi.com/rfidapi/api/ReferenceList/GetRLByRName?name=Role
  }
  deleteReferenceList(id: any) {
    return this.http.delete(environment.baseUrl + `ReferenceList/${id}`);
  }

}
