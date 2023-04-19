import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddReferenceListPage } from './add-reference-list.page';

describe('AddReferenceListPage', () => {
  let component: AddReferenceListPage;
  let fixture: ComponentFixture<AddReferenceListPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddReferenceListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
