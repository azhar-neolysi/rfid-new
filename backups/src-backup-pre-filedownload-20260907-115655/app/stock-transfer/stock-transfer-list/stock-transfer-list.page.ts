import { Component, OnInit } from '@angular/core';
import { StockService } from '../stock.service';
import { Router } from '@angular/router';
import { ReferenceListService } from 'src/app/reference-list/reference-list.service';

@Component({
  selector: 'app-stock-transfer-list',
  templateUrl: './stock-transfer-list.page.html',
  styleUrls: ['./stock-transfer-list.page.scss'],
})
export class StockTransferListPage implements OnInit {
  stockList: any = [];
  private refMap: Map<number, string> = new Map();
  constructor(private stock: StockService,private router:Router, private refList: ReferenceListService) {}

  ngOnInit() {
    this.loadRefList();
    this.getTransferedStock();
  }
  loadRefList() {
    this.refList.getReferenceList().subscribe({
      next: (res: any[]) => {
        this.refMap = new Map();
        (res || []).forEach((r) => {
          if (r.referenceListId != null) {
            this.refMap.set(r.referenceListId, r.name);
          }
        });
      },
      error: () => console.log('Failed to load reference list'),
    });
  }
  refName(id: any): string {
    if (id === null || id === undefined) return '-';
    return this.refMap.get(Number(id)) || String(id);
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
      this.router.navigate(['stock-transfer-list']).then(() => {
        this.getTransferedStock();
      });
    })
  }
  editTransferEntry(id:any){
    this.router.navigate(['stock-transfer',id]);
  }
}
