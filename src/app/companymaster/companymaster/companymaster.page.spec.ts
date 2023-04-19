import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompanymasterPage } from './companymaster.page';

describe('CompanymasterPage', () => {
  let component: CompanymasterPage;
  let fixture: ComponentFixture<CompanymasterPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(CompanymasterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
