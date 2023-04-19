import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RfidListPage } from './rfid-list.page';

describe('RfidListPage', () => {
  let component: RfidListPage;
  let fixture: ComponentFixture<RfidListPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(RfidListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
