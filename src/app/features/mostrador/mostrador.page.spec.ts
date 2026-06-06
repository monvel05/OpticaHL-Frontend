import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MostradorPage } from './mostrador.page';

describe('MostradorPage', () => {
  let component: MostradorPage;
  let fixture: ComponentFixture<MostradorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MostradorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
