import { TestBed } from '@angular/core/testing';

import { OperadoresService } from './operadores.service';

describe('OperadoresService', () => {
  let service: OperadoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OperadoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
