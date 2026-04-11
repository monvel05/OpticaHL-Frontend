import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelectorEntidadComponent } from './selector-entidad.component';

describe('SelectorEntidadComponent', () => {
  let component: SelectorEntidadComponent;
  let fixture: ComponentFixture<SelectorEntidadComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SelectorEntidadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectorEntidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
