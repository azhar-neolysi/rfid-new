import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private toast: ToastController) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let message = 'Something went wrong. Please try again.';

        if (error.status === 0) {
          message = 'No connection. Check your network.';
        } else if (error.status === 401) {
          message = 'Session expired. Please login again.';
        } else if (error.status === 404) {
          message = 'Resource not found.';
        } else if (error.status >= 500) {
          message = 'Server error. Please try again later.';
        }

        this.showToast(message);
        return throwError(() => error);
      })
    );
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toast.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
    });
    t.present();
  }
}
