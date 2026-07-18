import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { FormularioRecetaComponent } from './formulario-receta.component';

describe('FormularioRecetaComponent', () => {
  let component: FormularioRecetaComponent;
  let fixture: ComponentFixture<FormularioRecetaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ FormularioRecetaComponent ],
      providers: [ provideIonicAngular() ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioRecetaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
