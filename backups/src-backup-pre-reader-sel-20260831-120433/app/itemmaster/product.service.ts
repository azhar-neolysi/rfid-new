import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../services/base.service';
import { ProductEntry } from '../models/product-entry.model';

@Injectable({ providedIn: 'root' })
export class ProductService extends BaseService {
  addProduct(data: any): Observable<ProductEntry> {
    return this.post<ProductEntry>('api/ProductEntry', data);
  }

  updateProduct(data: any): Observable<void> {
    return this.put<void>(`api/ProductEntry/${data.productEntryId}`, data);
  }

  GetLastProducts(): Observable<ProductEntry[]> {
    return this.get<ProductEntry[]>('api/ProductEntry/GetLastNProducts?pCount=10');
  }

  getProducts(): Observable<ProductEntry[]> {
    return this.get<ProductEntry[]>('api/ProductEntry');
  }

  getProduct(id: number): Observable<ProductEntry> {
    return this.get<ProductEntry>(`api/ProductEntry/${id}`);
  }

  getProductbyBarcode(barcode: string): Observable<ProductEntry> {
    return this.get<ProductEntry>(`api/ProductEntry/GetProductEntryTbyBarcode?barcode=${barcode}`);
  }

  getProductwithSegment(id: number): Observable<ProductEntry> {
    return this.get<ProductEntry>(`api/ProductEntry/GetProductEntryT/?productEntryId=${id}`);
  }

  deleteProduct(id: number): Observable<void> {
    return this.delete<void>(`api/ProductEntry/${id}`);
  }

  searchProduct(params: { barcode: any; rfidcode: any }): Observable<ProductEntry> {
    return this.get<ProductEntry>(
      `api/ProductEntry/GetProductByRFIDorBarcode?barcode=${params.barcode}&rfidcode=${params.rfidcode}`
    );
  }
}
