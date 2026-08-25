import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { BaseService } from './base.service';
import { environment } from '../../environments/environment';

describe('BaseService', () => {
  let service: BaseService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.baseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BaseService],
    });

    service = TestBed.inject(BaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('GET', () => {
    it('should make a GET request with correct URL', () => {
      (service as any).get('/items').subscribe((res: any) => {
        expect(res).toEqual([{ id: 1 }]);
      });

      const req = httpMock.expectOne(`${baseUrl}items`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1 }]);
    });
  });

  describe('POST', () => {
    it('should make a POST request with body', () => {
      (service as any).post('/items', { name: 'test' }).subscribe((res: any) => {
        expect(res.id).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}items`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'test' });
      req.flush({ id: 1, name: 'test' });
    });
  });

  describe('PUT', () => {
    it('should make a PUT request with body', () => {
      (service as any).put('/items/1', { name: 'updated' }).subscribe();

      const req = httpMock.expectOne(`${baseUrl}items/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ name: 'updated' });
      req.flush({});
    });
  });

  describe('DELETE', () => {
    it('should make a DELETE request', () => {
      (service as any).delete('/items/1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}items/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  it('should handle typed responses', () => {
    service['get']('/item/5').subscribe((item: any) => {
      expect(item.id).toBe(5);
      expect(item.name).toBe('Widget');
    });

    const req = httpMock.expectOne(`${baseUrl}item/5`);
    req.flush({ id: 5, name: 'Widget' });
  });
});
