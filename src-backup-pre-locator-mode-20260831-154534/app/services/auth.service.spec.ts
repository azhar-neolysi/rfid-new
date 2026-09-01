import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, AuthToken } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const TOKEN_KEY = 'rfid_auth_token';

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    localStorage.removeItem(TOKEN_KEY);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(TOKEN_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isAuthenticated', () => {
    it('should return false when no token stored', () => {
      expect(service.isAuthenticated).toBeFalse();
    });

    it('should return true when valid token is stored', () => {
      const auth: AuthToken = {
        token: 'test-token',
        expiresAt: Date.now() + 60000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(auth));
      expect(service.isAuthenticated).toBeTrue();
    });

    it('should return false when token is expired', () => {
      const auth: AuthToken = {
        token: 'expired-token',
        expiresAt: Date.now() - 10000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(auth));
      expect(service.isAuthenticated).toBeFalse();
    });

    it('should return false when stored data is invalid JSON', () => {
      localStorage.setItem(TOKEN_KEY, 'not-json');
      expect(service.isAuthenticated).toBeFalse();
    });
  });

  describe('getToken', () => {
    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return the token when valid', () => {
      const auth: AuthToken = {
        token: 'abc123',
        expiresAt: Date.now() + 60000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(auth));
      expect(service.getToken()).toBe('abc123');
    });

    it('should return null and logout when token expired', () => {
      const auth: AuthToken = {
        token: 'expired',
        expiresAt: Date.now() - 5000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(auth));
      expect(service.getToken()).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should return null and logout when JSON is corrupt', () => {
      localStorage.setItem(TOKEN_KEY, '{bad json');
      expect(service.getToken()).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('login', () => {
    it('should POST to login endpoint and store token', () => {
      const response: AuthToken = {
        token: 'new-token',
        expiresAt: Date.now() + 60000,
      };

      service.login('admin', 'pass123').subscribe((res) => {
        expect(res.token).toBe('new-token');
        expect(service.isAuthenticated).toBeTrue();
        expect(service.getToken()).toBe('new-token');
      });

      const req = httpMock.expectOne(`${environment.baseUrl}api/User/Login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        userName: 'admin',
        password: 'pass123',
      });
      req.flush(response);
    });

    it('should update isAuthenticated$ observable on login', (done) => {
      const response: AuthToken = {
        token: 'tok',
        expiresAt: Date.now() + 60000,
      };

      service.isAuthenticated$.subscribe((val) => {
        if (val === true) {
          done();
        }
      });

      service.login('u', 'p').subscribe();
      httpMock.expectOne(`${environment.baseUrl}api/User/Login`).flush(response);
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage', () => {
      const auth: AuthToken = {
        token: 'tok',
        expiresAt: Date.now() + 60000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(auth));
      service.logout();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('should navigate to /login', () => {
      service.logout();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should set isAuthenticated to false', () => {
      const auth: AuthToken = {
        token: 'tok',
        expiresAt: Date.now() + 60000,
      };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(auth));
      service.logout();
      expect(service.isAuthenticated).toBeFalse();
    });
  });
});
