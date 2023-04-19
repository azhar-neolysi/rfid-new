import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RfidMasterPage } from './rfid-master.page';

describe('RfidMasterPage', () => {
  let component: RfidMasterPage;
  let fixture: ComponentFixture<RfidMasterPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(RfidMasterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
