import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { LoginPage } from './login.page';
import { AuthService } from '../services/auth.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let toastSpy: jasmine.SpyObj<ToastController>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['setLoggedIn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const mockToast = { present: jasmine.createSpy('present') };
    toastSpy.create.and.returnValue(Promise.resolve(mockToast as any));

    await TestBed.configureTestingModule({
      declarations: [LoginPage],
      imports: [ReactiveFormsModule, FormsModule],
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

    expect(authSpy.setLoggedIn).not.toHaveBeenCalled();
    expect(toastSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: 'Please enter username and password' })
    );
  }));

  it('should show toast when password is empty', fakeAsync(() => {
    component.userName = 'admin';
    component.password = '';
    component.login();
    tick();

    expect(authSpy.setLoggedIn).not.toHaveBeenCalled();
    expect(toastSpy.create).toHaveBeenCalled();
  }));

  it('should log in and navigate on valid credentials', fakeAsync(() => {
    component.userName = 'admin';
    component.password = 'admin';
    component.login();
    tick(500);

    expect(authSpy.setLoggedIn).toHaveBeenCalledWith(true);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading).toBeFalse();
  }));

  it('should show toast and stop loading on invalid credentials', fakeAsync(() => {
    component.userName = 'admin';
    component.password = 'wrong';
    component.login();
    tick(500);

    expect(authSpy.setLoggedIn).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(toastSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: 'Invalid credentials' })
    );
  }));
});
