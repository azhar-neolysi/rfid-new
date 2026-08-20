import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { ProductService } from 'src/app/itemmaster/product.service';
import { SaleService } from 'src/app/sale/sale.service';
import { StockService } from 'src/app/stock-transfer/stock.service';
import { ProductEntry } from 'src/app/models/product-entry.model';
import { Sale } from 'src/app/models/sale.model';
import { StockTransfer } from 'src/app/models/stock-transfer.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  totalProducts = 0;
  totalSales = 0;
  totalTransfers = 0;
  recentProducts: ProductEntry[] = [];
  chart: Chart;

  constructor(
    private productService: ProductService,
    private saleService: SaleService,
    private stockService: StockService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadCharts();
  }

  loadStats() {
    this.productService.getProducts().subscribe((res: ProductEntry[]) => {
      this.totalProducts = res.length;
      this.recentProducts = res.slice(0, 5);
    });
    this.saleService.getSaleList().subscribe((res: Sale[]) => {
      this.totalSales = res.length;
    });
    this.stockService.getstockTransfers().subscribe((res: StockTransfer[]) => {
      this.totalTransfers = res.length;
    });
  }

  loadCharts() {
    this.productService.GetLastProducts().subscribe((products: ProductEntry[]) => {
      this.createProductChart(products);
    });
  }

  private createProductChart(products: ProductEntry[]) {
    const labels = products.map((p) => p.productName?.substring(0, 15) || 'Unknown');
    const quantities = products.map((p) => Number(p.quantity) || 0);

    this.chart = new Chart('MyChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Quantity',
            data: quantities,
            backgroundColor: '#011644',
          },
        ],
      },
      options: {
        aspectRatio: 1.5,
        plugins: {
          legend: { display: false },
        },
      },
    });
  }
}
