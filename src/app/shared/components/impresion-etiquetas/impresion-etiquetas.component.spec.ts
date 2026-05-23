import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ImpresionEtiquetasComponent } from './impresion-etiquetas.component';

describe('ImpresionEtiquetasComponent', () => {
  let component: ImpresionEtiquetasComponent;
  let fixture: ComponentFixture<ImpresionEtiquetasComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ImpresionEtiquetasComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ImpresionEtiquetasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
