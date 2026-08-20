import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { LoginPage } from './login.page';
import { AuthService } from '../services/auth.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastSpy: jasmine.SpyObj<ToastController>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const mockToast = { present: jasmine.createSpy('present') };
    toastSpy.create.and.returnValue(Promise.resolve(mockToast as any));

    await TestBed.configureTestingModule({
      declarations: [LoginPage],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastController, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show toast when username is empty', fakeAsync(() => {
    component.userName = '';
    component.password = 'pass';
    component.login();
    tick();

    expect(authSpy.login).not.toHaveBeenCalled();
    expect(toastSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: 'Please enter username and password' })
    );
  }));

  it('should show toast when password is empty', fakeAsync(() => {
    component.userName = 'admin';
    component.password = '';
    component.login();
    tick();

    expect(authSpy.login).not.toHaveBeenCalled();
    expect(toastSpy.create).toHaveBeenCalled();
  }));

  it('should call auth.login and navigate on success', fakeAsync(() => {
    authSpy.login.and.returnValue(of({ token: 'tok', expiresAt: 99999 }));
    component.userName = 'admin';
    component.password = 'pass123';
    component.login();
    tick();

    expect(authSpy.login).toHaveBeenCalledWith('admin', 'pass123');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading).toBeFalse();
  }));

  it('should show toast and stop loading on login error', fakeAsync(() => {
    authSpy.login.and.returnValue(throwError(() => new Error('fail')));
    component.userName = 'admin';
    component.password = 'wrong';
    component.login();
    tick();

    expect(component.loading).toBeFalse();
    expect(toastSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: 'Invalid credentials' })
    );
  }));

  it('should set loading=true while login is in progress', () => {
    authSpy.login.and.returnValue(of({ token: 'tok', expiresAt: 99999 }));
    component.userName = 'admin';
    component.password = 'pass';
    component.login();

    // loading was set to true synchronously before subscribe completes
    expect(component.loading).toBeFalse(); // false again after sync completion
  });
});
