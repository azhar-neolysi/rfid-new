import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) {}
  createUser(data: any) {
    return this.http.post(environment.baseUrl + `User`, data);
  }
  deleteUser(id: any) {
    return this.http.delete(environment.baseUrl+`User/${id}`);
  }
  getUsers() {
    return this.http.get(environment.baseUrl+`User`);
  }
  getUser(id: any) {
    return this.http.get(environment.baseUrl+`User/${id}`);
  }
  editUser(data: any) {
    return this.http.put(environment.baseUrl+`User`,data);
  }

  //----------------User Mapping---------------------
  createMapp(data:any){
    return this.http.post(environment.baseUrl + `EmpUserMapping`, data)
  }
}
