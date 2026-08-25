import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { Role } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService extends BaseService {
  getRoles(): Observable<Role[]> {
    return this.get<Role[]>('api/Role');
  }

  getRole(id: number): Observable<Role> {
    return this.get<Role>(`api/Role/${id}`);
  }

  addRole(data: any): Observable<Role> {
    return this.post<Role>('api/Role', data);
  }

  updateRole(data: any): Observable<void> {
    return this.put<void>(`api/Role/${data.roleId}`, data);
  }

  deleteRole(id: number): Observable<void> {
    return this.delete<void>(`api/Role/${id}`);
  }
}
