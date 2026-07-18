import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VentasChartComponent } from './ventas-chart.component';

describe('VentasChartComponent', () => {
  let component: VentasChartComponent;
  let fixture: ComponentFixture<VentasChartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ VentasChartComponent ]
    }).compileComponents();

    fixture = TestBed.createComponent(VentasChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
