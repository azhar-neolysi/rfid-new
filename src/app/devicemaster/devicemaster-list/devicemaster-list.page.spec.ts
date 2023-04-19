import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DevicemasterListPage } from './devicemaster-list.page';

describe('DevicemasterListPage', () => {
  let component: DevicemasterListPage;
  let fixture: ComponentFixture<DevicemasterListPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(DevicemasterListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
