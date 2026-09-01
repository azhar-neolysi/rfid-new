import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { Employee } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService extends BaseService {
  getEmployees(): Observable<Employee[]> {
    return this.get<Employee[]>('api/Employee');
  }

  getEmployee(id: number): Observable<Employee> {
    return this.get<Employee>(`api/Employee/${id}`);
  }

  addEmployee(data: any): Observable<Employee> {
    return this.post<Employee>('api/Employee', data);
  }

  updateEmployee(data: any): Observable<void> {
    return this.put<void>(`api/Employee/${data.employeeId}`, data);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.delete<void>(`api/Employee/${id}`);
  }
}
