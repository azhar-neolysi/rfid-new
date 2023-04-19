import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalePage } from './sale.page';

describe('SalePage', () => {
  let component: SalePage;
  let fixture: ComponentFixture<SalePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(SalePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
