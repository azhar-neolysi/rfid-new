import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddUsersPage } from './add-users.page';

describe('AddUsersPage', () => {
  let component: AddUsersPage;
  let fixture: ComponentFixture<AddUsersPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddUsersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
