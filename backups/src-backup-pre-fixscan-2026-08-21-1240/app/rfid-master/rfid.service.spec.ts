import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RfidService } from './rfid.service';

describe('RfidService', () => {
  let service: RfidService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RfidService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
