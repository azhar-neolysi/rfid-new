import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveDashboardPage } from './live-dashboard.page';

describe('LiveDashboardPage', () => {
  let component: LiveDashboardPage;
  let fixture: ComponentFixture<LiveDashboardPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(LiveDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
