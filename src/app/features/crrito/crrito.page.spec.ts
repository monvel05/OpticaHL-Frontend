import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrritoPage } from './crrito.page';

describe('CrritoPage', () => {
  let component: CrritoPage;
  let fixture: ComponentFixture<CrritoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CrritoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
