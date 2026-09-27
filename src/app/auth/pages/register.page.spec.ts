import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let authFacadeSpy: jasmine.SpyObj<AuthFacade>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authFacadeSpy = jasmine.createSpyObj('AuthFacade', ['register', 'isLoading'], {
      isLoading: signal(false),
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        { provide: AuthFacade, useValue: authFacadeSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render register form with cedula, password, and confirm password fields', () => {
    const inputs = fixture.debugElement.queryAll(By.css('app-input'));
    expect(inputs.length).toBe(3);
  });

  it('should have cedula input with correct validation', () => {
    const cedulaInput = fixture.debugElement.query(By.css('app-input[label="Cédula"]'));
    expect(cedulaInput).toBeTruthy();
    expect(cedulaInput.componentInstance.required()).toBeTrue();
    expect(cedulaInput.componentInstance.minlength()).toBe(5);
    expect(cedulaInput.componentInstance.maxlength()).toBe(20);
  });

  it('should have password input with correct validation', () => {
    const passwordInput = fixture.debugElement.query(By.css('app-input[label="Contraseña"]'));
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.componentInstance.required()).toBeTrue();
    expect(passwordInput.componentInstance.minlength()).toBe(6);
    expect(passwordInput.componentInstance.maxlength()).toBe(50);
  });

  it('should have confirm password input with correct validation', () => {
    const confirmInput = fixture.debugElement.query(By.css('app-input[label="Confirmar contraseña"]'));
    expect(confirmInput).toBeTruthy();
    expect(confirmInput.componentInstance.required()).toBeTrue();
  });

  it('should show error when passwords do not match', () => {
    component.password = 'password123';
    component.confirmPassword = 'different';
    fixture.detectChanges();

    expect(component.passwordMismatch()).toBeTrue();
  });

  it('should not show error when passwords match', () => {
    component.password = 'password123';
    component.confirmPassword = 'password123';
    fixture.detectChanges();

    expect(component.passwordMismatch()).toBeFalse();
  });

  it('should disable submit button when passwords do not match', () => {
    component.nationalId = '12345';
    component.password = 'password123';
    component.confirmPassword = 'different';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.disabled()).toBeTrue();
  });

  it('should enable submit button when form is valid and passwords match', () => {
    component.nationalId = '12345';
    component.password = 'password123';
    component.confirmPassword = 'password123';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.disabled()).toBeFalse();
  });

  it('should call authFacade.register on form submit', async () => {
    authFacadeSpy.register.and.resolveTo(undefined);
    component.nationalId = '123456789';
    component.password = 'password123';
    component.confirmPassword = 'password123';
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    await fixture.whenStable();

    expect(authFacadeSpy.register).toHaveBeenCalledWith('123456789', 'password123', undefined);
  });

  it('should show error toast on register failure', async () => {
    authFacadeSpy.register.and.rejectWith({ message: 'Error al crear cuenta' });
    component.nationalId = '123456789';
    component.password = 'password123';
    component.confirmPassword = 'password123';
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    await fixture.whenStable();

    expect(component.showError()).toBeTrue();
    expect(component.errorMessage()).toBe('Error al crear cuenta');
  });

  it('should navigate to login page on "Ingresar" click', () => {
    const loginLink = fixture.debugElement.query(By.css('ion-button[fill="clear"]'));
    loginLink.triggerEventHandler('click', {});
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should navigate back to login on back button click', () => {
    const backButton = fixture.debugElement.query(By.css('ion-button[fill="clear"][slot="start"]'));
    backButton.triggerEventHandler('click', {});
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});