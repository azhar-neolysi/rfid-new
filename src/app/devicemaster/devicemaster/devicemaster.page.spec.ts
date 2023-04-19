import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DevicemasterPage } from './devicemaster.page';

describe('DevicemasterPage', () => {
  let component: DevicemasterPage;
  let fixture: ComponentFixture<DevicemasterPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(DevicemasterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
