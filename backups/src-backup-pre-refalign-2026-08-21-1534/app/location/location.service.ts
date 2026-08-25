import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { Location } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationService extends BaseService {
  getLocations(): Observable<Location[]> {
    return this.get<Location[]>('api/Location');
  }

  getLocation(id: number): Observable<Location> {
    return this.get<Location>(`api/Location/${id}`);
  }

  addLocation(data: any): Observable<Location> {
    return this.post<Location>('api/Location', data);
  }

  updateLocation(data: any): Observable<void> {
    return this.put<void>(`api/Location/${data.locationId}`, data);
  }

  deleteLocation(id: number): Observable<void> {
    return this.delete<void>(`api/Location/${id}`);
  }
}
