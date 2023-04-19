import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}
  addProduct(data: any) {
    return this.http.post(environment.baseUrl + `ProductMaster`, data);
  }
  updateProduct(data: any) {
    return this.http.put(
      environment.baseUrl + `ProductMaster/${data.productMasterId}`,
      data
    );
  }
  getProducts() {
    return this.http.get(environment.baseUrl + `ProductMaster`);
  }
  getProduct(id: any) {
    return this.http.get(environment.baseUrl + `ProductMaster/${id}`);
  }
  deleteProduct(id: any) {
    return this.http.delete(environment.baseUrl + `ProductMaster/${id}`);
  }
}
