import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { ErrorInterceptor } from './error.interceptor';

describe('ErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let toastSpy: jasmine.SpyObj<ToastController>;

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const mockToast = { present: jasmine.createSpy('present') };
    toastSpy.create.and.returnValue(Promise.resolve(mockToast as any));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorInterceptor,
          multi: true,
        },
        { provide: ToastController, useValue: toastSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(ErrorInterceptor).toBeTruthy();
  });

  it('should pass through successful responses', (done) => {
    httpClient.get('/ok').subscribe((res) => {
      expect(res).toEqual({ data: 'ok' });
      done();
    });

    const req = httpMock.expectOne('/ok');
    req.flush({ data: 'ok' });
    expect(toastSpy.create).not.toHaveBeenCalled();
  });

  it('should show "No connection" toast on status 0', (done) => {
    httpClient.get('/fail').subscribe({
      error: () => {
        expect(toastSpy.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            message: 'No connection. Check your network.',
            color: 'danger',
          })
        );
        done();
      },
    });

    const req = httpMock.expectOne('/fail');
    req.error(new ProgressEvent('error'), { status: 0 });
  });

  it('should show "Session expired" toast on 401', (done) => {
    httpClient.get('/unauth').subscribe({
      error: () => {
        expect(toastSpy.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            message: 'Session expired. Please login again.',
          })
        );
        done();
      },
    });

    const req = httpMock.expectOne('/unauth');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('should show "Resource not found" toast on 404', (done) => {
    httpClient.get('/missing').subscribe({
      error: () => {
        expect(toastSpy.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            message: 'Resource not found.',
          })
        );
        done();
      },
    });

    const req = httpMock.expectOne('/missing');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  it('should show "Server error" toast on 500', (done) => {
    httpClient.get('/crash').subscribe({
      error: () => {
        expect(toastSpy.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            message: 'Server error. Please try again later.',
          })
        );
        done();
      },
    });

    const req = httpMock.expectOne('/crash');
    req.flush('Internal Error', { status: 500, statusText: 'Server Error' });
  });

  it('should show generic toast on unknown error', (done) => {
    httpClient.get('/weird').subscribe({
      error: () => {
        expect(toastSpy.create).toHaveBeenCalledWith(
          jasmine.objectContaining({
            message: 'Something went wrong. Please try again.',
          })
        );
        done();
      },
    });

    const req = httpMock.expectOne('/weird');
    req.flush('Error', { status: 422, statusText: 'Unprocessable' });
  });

  it('should re-throw the error after showing toast', (done) => {
    httpClient.get('/err').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(503);
        done();
      },
    });

    const req = httpMock.expectOne('/err');
    req.flush('Down', { status: 503, statusText: 'Unavailable' });
  });
});
