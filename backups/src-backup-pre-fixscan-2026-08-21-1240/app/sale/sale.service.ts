import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { Sale } from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService extends BaseService {
  saleEntry(data: any): Observable<Sale> {
    return this.post<Sale>('api/Sale', data);
  }

  editSale(data: any): Observable<void> {
    return this.put<void>(`api/Sale/${data.salesId}`, data);
  }

  getSaleList(): Observable<Sale[]> {
    return this.get<Sale[]>('api/Sale');
  }

  getSale(id: number): Observable<Sale> {
    return this.get<Sale>(`api/Sale/${id}`);
  }

  deleteSale(id: number): Observable<void> {
    return this.delete<void>(`api/Sale/${id}`);
  }
}
