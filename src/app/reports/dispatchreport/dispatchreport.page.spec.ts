import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DispatchreportPage } from './dispatchreport.page';

describe('DispatchreportPage', () => {
  let component: DispatchreportPage;
  let fixture: ComponentFixture<DispatchreportPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(DispatchreportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
