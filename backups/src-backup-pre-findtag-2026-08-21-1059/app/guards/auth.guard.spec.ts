import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: false,
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  function fakeRoute(overrides?: Partial<ActivatedRouteSnapshot>): ActivatedRouteSnapshot {
    return {
      params: {},
      queryParams: {},
      data: {},
      ...overrides,
    } as unknown as ActivatedRouteSnapshot;
  }

  function fakeState(url: string): RouterStateSnapshot {
    return { url, root: {} as any } as RouterStateSnapshot;
  }

  it('should allow access when authenticated', () => {
    (authSpy as any).isAuthenticated = true;
    const result = guard.canActivate(fakeRoute(), fakeState('/dashboard'));
    expect(result).toBeTrue();
  });

  it('should block access when not authenticated', () => {
    (authSpy as any).isAuthenticated = false;
    const result = guard.canActivate(fakeRoute(), fakeState('/dashboard'));
    expect(result).toBeFalse();
  });

  it('should navigate to /login when not authenticated', () => {
    (authSpy as any).isAuthenticated = false;
    guard.canActivate(fakeRoute(), fakeState('/some-page'));
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/some-page' },
    });
  });

  it('should not navigate when authenticated', () => {
    (authSpy as any).isAuthenticated = true;
    guard.canActivate(fakeRoute(), fakeState('/dashboard'));
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should pass the return URL correctly', () => {
    (authSpy as any).isAuthenticated = false;
    guard.canActivate(fakeRoute(), fakeState('/stock-transfer/42'));
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: '/stock-transfer/42' } }
    );
  });
});
