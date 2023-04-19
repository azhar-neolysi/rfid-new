import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddReferencePage } from './add-reference.page';

describe('AddReferencePage', () => {
  let component: AddReferencePage;
  let fixture: ComponentFixture<AddReferencePage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddReferencePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
