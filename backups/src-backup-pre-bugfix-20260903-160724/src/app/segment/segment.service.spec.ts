import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SegmentService } from './segment.service';

describe('SegmentService', () => {
  let service: SegmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SegmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
