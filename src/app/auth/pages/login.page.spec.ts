import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authFacadeSpy: jasmine.SpyObj<AuthFacade>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authFacadeSpy = jasmine.createSpyObj('AuthFacade', ['login', 'isLoading'], {
      isLoading: signal(false),
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthFacade, useValue: authFacadeSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render login form with cedula and password fields', () => {
    const inputs = fixture.debugElement.queryAll(By.css('app-input'));
    expect(inputs.length).toBe(2);
  });

  it('should have cedula input with correct label and validation', () => {
    const cedulaInput = fixture.debugElement.query(By.css('app-input[label="Cédula"]'));
    expect(cedulaInput).toBeTruthy();
    expect(cedulaInput.componentInstance.required()).toBeTrue();
    expect(cedulaInput.componentInstance.minlength()).toBe(5);
    expect(cedulaInput.componentInstance.maxlength()).toBe(20);
    expect(cedulaInput.componentInstance.inputmode()).toBe('numeric');
  });

  it('should have password input with correct label and validation', () => {
    const passwordInput = fixture.debugElement.query(By.css('app-input[label="Contraseña"]'));
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.componentInstance.required()).toBeTrue();
    expect(passwordInput.componentInstance.minlength()).toBe(6);
    expect(passwordInput.componentInstance.maxlength()).toBe(50);
    expect(passwordInput.componentInstance.type()).toBe('password');
  });

  it('should have submit button', () => {
    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button).toBeTruthy();
    expect(button.componentInstance.loading()).toBeFalse();
  });

  it('should disable submit button when form is invalid', () => {
    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.disabled()).toBeTrue();
  });

  it('should enable submit button when form is valid', () => {
    component.nationalId = '12345';
    component.password = '123456';
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.disabled()).toBeFalse();
  });

  it('should call authFacade.login on form submit', async () => {
    authFacadeSpy.login.and.resolveTo(undefined);
    component.nationalId = '123456789';
    component.password = 'password123';
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    await fixture.whenStable();
    expect(authFacadeSpy.login).toHaveBeenCalledWith('123456789', 'password123');
  });

  it('should show error toast on login failure', async () => {
    authFacadeSpy.login.and.rejectWith({ message: 'Credenciales inválidas' });
    component.nationalId = '123456789';
    component.password = 'wrong';
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    await fixture.whenStable();

    expect(component.showError()).toBeTrue();
    expect(component.errorMessage()).toBe('Credenciales inválidas');
  });

  it('should navigate to register page on "Crear cuenta" click', () => {
    const registerLink = fixture.debugElement.query(By.css('ion-button[fill="clear"]'));
    registerLink.triggerEventHandler('click', {});
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/register']);
  });

  it('should show loading state on button during login', async () => {
    let resolveLogin: () => void;
    const loginPromise = new Promise<void>((resolve) => { resolveLogin = resolve; });
    authFacadeSpy.login.and.returnValue(loginPromise);

    component.nationalId = '123456789';
    component.password = 'password123';
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    expect(component.isLoading()).toBeTrue();
    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.loading()).toBeTrue();

    resolveLogin!();
    await fixture.whenStable();
  });
});