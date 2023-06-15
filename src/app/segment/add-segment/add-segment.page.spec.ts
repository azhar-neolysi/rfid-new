import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddSegmentPage } from './add-segment.page';

describe('AddSegmentPage', () => {
  let component: AddSegmentPage;
  let fixture: ComponentFixture<AddSegmentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(AddSegmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
