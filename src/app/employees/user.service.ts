import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { User } from '../models/user.model';
import { EmpUserMapping } from '../models/emp-user-mapping.model';

@Injectable({ providedIn: 'root' })
export class UserService extends BaseService {
  createUser(data: any): Observable<User> {
    return this.post<User>('api/User', data);
  }

  deleteUser(id: number): Observable<void> {
    return this.delete<void>(`api/User/${id}`);
  }

  getUsers(): Observable<User[]> {
    return this.get<User[]>('api/User');
  }

  getUser(id: number): Observable<User> {
    return this.get<User>(`api/User/${id}`);
  }

  editUser(data: any): Observable<void> {
    return this.put<void>(`api/User/${data.userId}`, data);
  }

  createMapp(data: any): Observable<EmpUserMapping> {
    return this.post<EmpUserMapping>('api/EmpUserMapping', data);
  }
}
