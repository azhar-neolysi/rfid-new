import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { ToastrService } from './toastr.service';

describe('ToastrService', () => {
  let service: ToastrService;
  let toastSpy: jasmine.SpyObj<ToastController>;
  let mockToast: { present: jasmine.Spy };

  beforeEach(() => {
    mockToast = { present: jasmine.createSpy('present') };
    toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    toastSpy.create.and.returnValue(Promise.resolve(mockToast as any));

    TestBed.configureTestingModule({
      providers: [
        ToastrService,
        { provide: ToastController, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(ToastrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create success toast with green color', async () => {
    service.success('Saved!');
    await new Promise((r) => setTimeout(r, 0));

    expect(toastSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Saved!',
        color: 'success',
        duration: 2000,
        position: 'top',
      })
    );
    expect(mockToast.present).toHaveBeenCalled();
  });

  it('should create warning toast with warning color', async () => {
    service.warning('Caution');
    await new Promise((r) => setTimeout(r, 0));

    expect(toastSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Caution',
        color: 'warning',
      })
    );
  });

  it('should create danger toast with danger color', async () => {
    service.danger('Error occurred');
    await new Promise((r) => setTimeout(r, 0));

    expect(toastSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({
        message: 'Error occurred',
        color: 'danger',
      })
    );
  });

  it('should pass message through correctly', async () => {
    const longMessage = 'A'.repeat(200);
    service.success(longMessage);
    await new Promise((r) => setTimeout(r, 0));

    expect(toastSpy.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: longMessage })
    );
  });
});
