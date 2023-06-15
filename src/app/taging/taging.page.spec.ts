import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagingPage } from './taging.page';

describe('TagingPage', () => {
  let component: TagingPage;
  let fixture: ComponentFixture<TagingPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TagingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
