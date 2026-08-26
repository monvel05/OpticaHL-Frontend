import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SucursalesPage } from './sucursales.page';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('SucursalesPage', () => {
  let component: SucursalesPage;
  let fixture: ComponentFixture<SucursalesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SucursalesPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SucursalesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse la página de sucursales', () => {
    expect(component).toBeTruthy();
  });
});
