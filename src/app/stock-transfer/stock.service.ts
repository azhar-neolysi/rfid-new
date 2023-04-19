import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class StockService {
  constructor(private http: HttpClient) {}
  stockTransferEntry(data: any) {
    return this.http.post(environment.baseUrl + `StockTransfer`, data);
  }
  editStockTransfer(data: any) {
    return this.http.put(environment.baseUrl + `StockTransfer/${data.stockTransferId}`, data);
  }
  getstockTransfers() {
    return this.http.get(environment.baseUrl + `StockTransfer`);
  }
  getstockTransfer(id: any) {
    return this.http.get(environment.baseUrl + `StockTransfer/${id}`);
  }
  deleteStockTransfer(id: any) {
    return this.http.get(environment.baseUrl + `StockTransfer/${id}`);
  }
}
