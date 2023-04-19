import { Component, OnInit } from '@angular/core';
import { SaleService } from '../sale.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sale',
  templateUrl: './sale.page.html',
  styleUrls: ['./sale.page.scss'],
})
export class SalePage implements OnInit {
  saleList:any=[];
  constructor(private sale: SaleService,private router:Router) {}

  ngOnInit() {
    this.getSaleList();
  }
  getSaleList() {
    this.sale.getSaleList().subscribe((res: any) => {
      console.log(res);
      this.saleList=res;
    });
  }
  saleEntry(){
    this.router.navigate(['sale-entry'])
  }
  editSale(id:any){
    this.router.navigate(['sale-entry',id])
  }
  deleteSale(salesId:any){
    this.sale.deleteSale(salesId).subscribe((res:any)=>{
      console.log(res);
      window.location.reload();
    })
  }
}
