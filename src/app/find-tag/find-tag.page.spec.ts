import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FindTagPage } from './find-tag.page';

describe('FindTagPage', () => {
  let component: FindTagPage;
  let fixture: ComponentFixture<FindTagPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(FindTagPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
