import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReferenceListPage } from './reference-list.page';

describe('ReferenceListPage', () => {
  let component: ReferenceListPage;
  let fixture: ComponentFixture<ReferenceListPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ReferenceListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
