import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReferencePage } from './reference.page';

describe('ReferencePage', () => {
  let component: ReferencePage;
  let fixture: ComponentFixture<ReferencePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ReferencePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
