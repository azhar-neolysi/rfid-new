import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockTransferListPage } from './stock-transfer-list.page';

describe('StockTransferListPage', () => {
  let component: StockTransferListPage;
  let fixture: ComponentFixture<StockTransferListPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(StockTransferListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
