import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemmasterPage } from './itemmaster.page';

describe('ItemmasterPage', () => {
  let component: ItemmasterPage;
  let fixture: ComponentFixture<ItemmasterPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ItemmasterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
