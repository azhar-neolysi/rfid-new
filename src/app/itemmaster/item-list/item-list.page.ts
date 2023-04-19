import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.page.html',
  styleUrls: ['./item-list.page.scss'],
})
export class ItemListPage implements OnInit {
  products: any = [];
  productsTemp: any = [];
  constructor(private product: ProductService, private router: Router) {}

  ngOnInit() {
    this.getProducts();
  }
  getProducts() {
    this.product.getProducts().subscribe((res: any) => {
      console.log(res);
      this.products = res;
      this.productsTemp = res;
    });
  }
  addProduct() {
    this.router.navigate(['itemmaster']);
  }
  search(event: any) {
    this.products = this.productsTemp;
    console.log(this.products);
    console.log(event.detail.value);
    if (event.detail.value === '') {
      this.products = this.productsTemp;

      // this.vehicleList = this.vehicleListTemp;
      // this.vehicleList = this.vehicleList;
    } else {
      this.products = this.products.filter((item: any) =>
        item.productName
          .toLowerCase()
          .includes(event.detail.value.toLowerCase())
      );
      console.log(this.products);
    }
  }
  deleteProduct(id: any) {
    this.product.deleteProduct(id).subscribe((res: any) => {
      console.log(res);
      window.location.reload();
    });
  }
  editProduct(id: any) {
    this.router.navigate(['itemmaster', id]);
  }
}
