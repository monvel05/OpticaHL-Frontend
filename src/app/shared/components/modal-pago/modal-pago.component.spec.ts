import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { ModalPagoComponent } from './modal-pago.component';

describe('ModalPagoComponent', () => {
  let component: ModalPagoComponent;
  let fixture: ComponentFixture<ModalPagoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ ModalPagoComponent ],
      providers: [ provideIonicAngular() ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalPagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
