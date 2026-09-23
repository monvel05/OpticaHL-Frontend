import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CortecajaPage } from './cortecaja.page';

describe('CortecajaPage', () => {
  let component: CortecajaPage;
  let fixture: ComponentFixture<CortecajaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CortecajaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
