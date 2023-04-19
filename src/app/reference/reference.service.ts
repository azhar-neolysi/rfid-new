import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ReferenceService {
  constructor(private http: HttpClient) {}
  addReference(data: any) {
    console.log(data);
    return this.http.post(environment.baseUrl + `Reference`, data);
  }
  getReference() {
    return this.http.get(environment.baseUrl + `Reference`);
  }
  getReferenceById(id: any) {
    return this.http.get(environment.baseUrl + `Reference/${id}`);
  }
  updateReference(data: any) {
    return this.http.put(
      environment.baseUrl + `Reference/${data.referenceId}`,
      data
    );
  }
  deleteReference(id: any) {
    return this.http.delete(environment.baseUrl + `Reference/${id}`);
  }
}
