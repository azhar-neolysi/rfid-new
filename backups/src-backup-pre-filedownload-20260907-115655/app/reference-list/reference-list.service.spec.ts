import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ReferenceListService } from './reference-list.service';

describe('ReferenceListService', () => {
  let service: ReferenceListService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ReferenceListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
