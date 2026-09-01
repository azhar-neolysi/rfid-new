import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpRequest,
} from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { AuthToken } from '../services/auth.service';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authSpy: jasmine.SpyObj<AuthService>;

  const TOKEN_KEY = 'rfid_auth_token';

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    localStorage.removeItem(TOKEN_KEY);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        { provide: AuthService, useValue: authSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(TOKEN_KEY);
  });

  it('should add Authorization header when token exists', () => {
    authSpy.getToken.and.returnValue('my-jwt-token');

    httpClient.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });

  it('should NOT add Authorization header when no token', () => {
    authSpy.getToken.and.returnValue(null);

    httpClient.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should pass request through unchanged with token', () => {
    authSpy.getToken.and.returnValue('tok');

    httpClient.post('/data', { key: 'val' }).subscribe();

    const req = httpMock.expectOne('/data');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ key: 'val' });
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({ ok: true });
  });

  it('should handle multiple concurrent requests', () => {
    authSpy.getToken.and.returnValue('shared-token');

    httpClient.get('/a').subscribe();
    httpClient.get('/b').subscribe();

    const reqA = httpMock.expectOne('/a');
    const reqB = httpMock.expectOne('/b');
    expect(reqA.request.headers.get('Authorization')).toBe('Bearer shared-token');
    expect(reqB.request.headers.get('Authorization')).toBe('Bearer shared-token');
    reqA.flush({});
    reqB.flush({});
  });
});
