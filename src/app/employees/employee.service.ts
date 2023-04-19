import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http'
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
// baseUrl=environment.baseUrl;
  constructor(private http:HttpClient) { }
  getEmployees(){
    console.log(environment.baseUrl+`Employee`);
    return this.http.get(environment.baseUrl+`Employee`)
  }
  getEmployee(id:any){
    console.log(environment.baseUrl+`Employee/${id}`);
    return this.http.get(environment.baseUrl+`Employee/${id}`)
  }
  addEmployee(data:any){
    console.log(environment.baseUrl+`Employee`,data);
    return this.http.post(environment.baseUrl+`Employee`,data)
  }
  updateEmployee(data:any){
    console.log(environment.baseUrl+`Employee/${data.employeeId}`,data);
    return this.http.put(environment.baseUrl+`Employee/${data.employeeId}`,data)
  }
  deleteEmployee(id:any){
    console.log(environment.baseUrl+`Employee/${id}`);
    return this.http.get(environment.baseUrl+`Employee/${id}`)
  }
}
