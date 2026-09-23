import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StockCriticoListComponent } from './stock-critico-list.component';

describe('StockCriticoListComponent', () => {
  let component: StockCriticoListComponent;
  let fixture: ComponentFixture<StockCriticoListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [StockCriticoListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StockCriticoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
