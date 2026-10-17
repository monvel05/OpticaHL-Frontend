import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValesInventarioPage } from './vales-inventario.page';

describe('ValesInventarioPage', () => {
  let component: ValesInventarioPage;
  let fixture: ComponentFixture<ValesInventarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ValesInventarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
