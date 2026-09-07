import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DevicemasterService } from './devicemaster.service';

describe('DevicemasterService', () => {
  let service: DevicemasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DevicemasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
