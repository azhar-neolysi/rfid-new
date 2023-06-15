import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}
  addProduct(data: any) {
    return this.http.post(environment.baseUrl + `ProductEntry`, data);
  }
  updateProduct(data: any) {
    return this.http.put(
      environment.baseUrl + `ProductEntry/${data.productEntryId}`,
      data
    );
  }
  GetLastProducts() {
    // https://cloud.neolysi.com/rfidapi/api/ProductEntry/GetLastNProducts?pCount=5
   const page=10;
    return this.http.get(environment.baseUrl + `ProductEntry/GetLastNProducts?pCount=10`);
    // return this.http.get(environment.baseUrl + `ProductEntry`);
  }
  getProducts() {
    // https://cloud.neolysi.com/rfidapi/api/ProductEntry/GetLastNProducts?pCount=5
   const page=10;
    // return this.http.get(environment.baseUrl + `ProductEntry/GetLastNProducts?pCount=10`);
    return this.http.get(environment.baseUrl + `ProductEntry`);
  }
  getProduct(id: any) {
    return this.http.get(environment.baseUrl + `ProductEntry/${id}`);
  }
  getProductbyBarcode(id: any) {
    return this.http.get(environment.baseUrl + `ProductEntry/GetProductEntryTbyBarcode?barcode=${id}`);
  }
  getProductwithSegment(id: any) {
    // https://cloud.neolysi.com/rfidapi/api/ProductEntry/GetProductEntryT/?productEntryId=10
    return this.http.get(environment.baseUrl + `ProductEntry/GetProductEntryT/?productEntryId=${id}`);
  }
  deleteProduct(id: any) {
    return this.http.delete(environment.baseUrl + `ProductEntry/${id}`);
  }
  searchProduct(data: any) {
    console.log(environment.baseUrl + `ProductEntry/GetProductByRFIDorBarcode?barcode=${data.barcode}&rfidcode=${data.rfidcode}`);
    return this.http.get(environment.baseUrl + `ProductEntry/GetProductByRFIDorBarcode?barcode=${data.barcode}&rfidcode=${data.rfidcode}`);
  }
}
