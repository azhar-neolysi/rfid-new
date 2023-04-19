import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrentstockreportPage } from './currentstockreport.page';

describe('CurrentstockreportPage', () => {
  let component: CurrentstockreportPage;
  let fixture: ComponentFixture<CurrentstockreportPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(CurrentstockreportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
