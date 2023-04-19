import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaleEntryPage } from './sale-entry.page';

describe('SaleEntryPage', () => {
  let component: SaleEntryPage;
  let fixture: ComponentFixture<SaleEntryPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(SaleEntryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
