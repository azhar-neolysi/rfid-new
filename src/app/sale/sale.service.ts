import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class SaleService {
  constructor(private http: HttpClient) {}
  saleEntry(data: any) {
    return this.http.post(environment.baseUrl + `Sale`, data);
  }
  editSale(data: any) {
    return this.http.put(environment.baseUrl + `Sale/${data.salesId}`, data);
  }
  getSaleList() {
    return this.http.get(environment.baseUrl + `Sale`);
  }
  getSale(id: any) {
    return this.http.get(environment.baseUrl + `Sale/${id}`);
  }
  deleteSale(id: any) {
    return this.http.delete(environment.baseUrl + `Sale/${id}`);
  }
}
