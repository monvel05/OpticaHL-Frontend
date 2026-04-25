import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormularioArticuloComponent } from './formulario-articulo.component';

describe('FormularioArticuloComponent', () => {
  let component: FormularioArticuloComponent;
  let fixture: ComponentFixture<FormularioArticuloComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormularioArticuloComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioArticuloComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
