import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { StockTransfer } from '../models/stock-transfer.model';

@Injectable({ providedIn: 'root' })
export class StockService extends BaseService {
  stockTransferEntry(data: any): Observable<StockTransfer> {
    return this.post<StockTransfer>('api/StockTransfer', data);
  }

  editStockTransfer(data: any): Observable<void> {
    return this.put<void>(`api/StockTransfer/${data.stockTransferId}`, data);
  }

  getstockTransfers(): Observable<StockTransfer[]> {
    return this.get<StockTransfer[]>('api/StockTransfer');
  }

  getstockTransfer(id: number): Observable<StockTransfer> {
    return this.get<StockTransfer>(`api/StockTransfer/${id}`);
  }

  deleteStockTransfer(id: number): Observable<void> {
    return this.delete<void>(`api/StockTransfer/${id}`);
  }
}
