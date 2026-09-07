import { Component, OnInit } from '@angular/core';
import { StockService } from '../stock.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stock-transfer-list',
  templateUrl: './stock-transfer-list.page.html',
  styleUrls: ['./stock-transfer-list.page.scss'],
})
export class StockTransferListPage implements OnInit {
  stockList: any = [];
  constructor(private stock: StockService,private router:Router) {}

  ngOnInit() {
    this.getTransferedStock();
  }
  getTransferedStock() {
    this.stock.getstockTransfers().subscribe((res: any) => {
      console.log(res);
      this.stockList = res;
    });
  }
  stockTransferEntry() {
    this.router.navigate(['stock-transfer']);
  }
  search(event: any) {}
  deleteTransferEntry(id:any){
    this.stock.deleteStockTransfer(id).subscribe((res:any)=>{
      console.log(res);
      window.location.reload();
    })
  }
  editTransferEntry(id:any){
    this.router.navigate(['stock-transfer',id]);
  }
}
