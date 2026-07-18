import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { HistorialOrdenComponent } from './historial-orden.component';

describe('HistorialOrdenComponent', () => {
  let component: HistorialOrdenComponent;
  let fixture: ComponentFixture<HistorialOrdenComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ HistorialOrdenComponent ],
      providers: [ provideIonicAngular() ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialOrdenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
