import { TestBed } from '@angular/core/testing';

import { DevicemasterService } from './devicemaster.service';

describe('DevicemasterService', () => {
  let service: DevicemasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DevicemasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
