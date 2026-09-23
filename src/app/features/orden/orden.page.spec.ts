import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdenPage } from './orden.page';

describe('OrdenPage', () => {
  let component: OrdenPage;
  let fixture: ComponentFixture<OrdenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrdenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
