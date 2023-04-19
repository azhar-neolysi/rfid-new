import { TestBed } from '@angular/core/testing';

import { ReferenceListService } from './reference-list.service';

describe('ReferenceListService', () => {
  let service: ReferenceListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReferenceListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
