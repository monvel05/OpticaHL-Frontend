import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { ImpresionEtiquetasComponent } from './impresion-etiquetas.component';

describe('ImpresionEtiquetasComponent', () => {
  let component: ImpresionEtiquetasComponent;
  let fixture: ComponentFixture<ImpresionEtiquetasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ ImpresionEtiquetasComponent ],
      providers: [ provideIonicAngular() ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresionEtiquetasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
