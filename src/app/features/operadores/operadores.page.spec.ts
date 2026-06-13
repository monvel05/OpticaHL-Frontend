import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OperadoresPage } from './operadores.page';

describe('OperadoresPage', () => {
  let component: OperadoresPage;
  let fixture: ComponentFixture<OperadoresPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OperadoresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
