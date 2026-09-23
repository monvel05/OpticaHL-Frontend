import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RefraccionPage } from './refraccion.page';

describe('RefraccionPage', () => {
  let component: RefraccionPage;
  let fixture: ComponentFixture<RefraccionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RefraccionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
