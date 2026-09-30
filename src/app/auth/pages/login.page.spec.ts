import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { signal, WritableSignal } from '@angular/core';
import type { Mock } from 'vitest';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authFacadeMock: { login: Mock<AuthFacade['login']>; isLoading: WritableSignal<boolean> };
  let routerMock: { navigate: Mock<Router['navigate']> };

  // Simula la escritura del usuario: el componente es OnPush (por defecto en Angular 22),
  // así que asignar los campos directamente no refrescaría la vista.
  const typeInto = (label: string, value: string): void => {
    const ionInput = fixture.debugElement.query(By.css(`app-input[label="${label}"] ion-input`));
    ionInput.nativeElement.value = value;
    ionInput.triggerEventHandler('ionInput', { target: ionInput.nativeElement });
  };

  const fillForm = async (nationalId: string, password: string): Promise<void> => {
    typeInto('Cédula', nationalId);
    typeInto('Contraseña', password);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    authFacadeMock = {
      login: vi.fn<AuthFacade['login']>(),
      isLoading: signal(false),
    };
    routerMock = { navigate: vi.fn<Router['navigate']>() };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthFacade, useValue: authFacadeMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // ngModel registra los controles de forma asíncrona; se refresca la vista con el estado del formulario
    await fixture.whenStable();
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
    expect(cedulaInput.componentInstance.required()).toBe(true);
    expect(cedulaInput.componentInstance.minlength()).toBe(5);
    expect(cedulaInput.componentInstance.maxlength()).toBe(20);
    expect(cedulaInput.componentInstance.inputmode()).toBe('numeric');
  });

  it('should have password input with correct label and validation', () => {
    const passwordInput = fixture.debugElement.query(By.css('app-input[label="Contraseña"]'));
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.componentInstance.required()).toBe(true);
    expect(passwordInput.componentInstance.minlength()).toBe(6);
    expect(passwordInput.componentInstance.maxlength()).toBe(50);
    expect(passwordInput.componentInstance.type()).toBe('password');
  });

  it('should have submit button', () => {
    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button).toBeTruthy();
    expect(button.componentInstance.loading()).toBe(false);
  });

  it('should disable submit button when form is invalid', () => {
    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.disabled()).toBe(true);
  });

  it('should enable submit button when form is valid', async () => {
    await fillForm('12345', '123456');

    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.disabled()).toBe(false);
  });

  it('should call authFacade.login on form submit', async () => {
    authFacadeMock.login.mockResolvedValue(undefined);
    await fillForm('123456789', 'password123');

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    await fixture.whenStable();

    expect(authFacadeMock.login).toHaveBeenCalledWith('123456789', 'password123');
  });

  it('should show error toast on login failure', async () => {
    authFacadeMock.login.mockRejectedValue({ message: 'Credenciales inválidas' });
    await fillForm('123456789', 'wrong');

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    await fixture.whenStable();

    expect(component.showError()).toBe(true);
    expect(component.errorMessage()).toBe('Credenciales inválidas');
  });

  it('should navigate to register page on "Crear cuenta" click', () => {
    const registerLink = fixture.debugElement.query(By.css('.register-link ion-button'));
    registerLink.triggerEventHandler('click', {});
    expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/register']);
  });

  it('should show loading state on button during login', async () => {
    let resolveLogin!: () => void;
    // Igual que AuthFacade.login: isLoading es true mientras la petición está en curso
    authFacadeMock.login.mockImplementation(() => {
      authFacadeMock.isLoading.set(true);
      return new Promise<void>((resolve) => {
        resolveLogin = resolve;
      }).finally(() => authFacadeMock.isLoading.set(false));
    });
    await fillForm('123456789', 'password123');

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.loading()).toBe(true);

    resolveLogin();
    await fixture.whenStable();
    expect(component.isLoading()).toBe(false);
  });
});
