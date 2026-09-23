import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DescuentoPage } from './descuento.page';

describe('DescuentoPage', () => {
  let component: DescuentoPage;
  let fixture: ComponentFixture<DescuentoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DescuentoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
