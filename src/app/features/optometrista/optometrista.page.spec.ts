import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OptometristaPage } from './optometrista.page';

describe('OptometristaPage', () => {
  let component: OptometristaPage;
  let fixture: ComponentFixture<OptometristaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OptometristaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
