import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReciboPage } from './recibo.page';

describe('ReciboPage', () => {
  let component: ReciboPage;
  let fixture: ComponentFixture<ReciboPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReciboPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
