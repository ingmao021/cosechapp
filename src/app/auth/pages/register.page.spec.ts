import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterPage } from './register.page';
import { AuthFacade } from '../services/auth.facade';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { signal, WritableSignal } from '@angular/core';
import type { Mock } from 'vitest';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;
  let authFacadeMock: {
    register: Mock<AuthFacade['register']>;
    isLoading: WritableSignal<boolean>;
    error: WritableSignal<string | null>;
  };
  let routerMock: { navigate: Mock<Router['navigate']> };

  // Simula la escritura del usuario: el componente es OnPush (por defecto en Angular 22),
  // así que asignar los campos directamente no refrescaría la vista.
  const typeInto = (label: string, value: string): void => {
    const ionInput = fixture.debugElement.query(By.css(`app-input[label="${label}"] ion-input`));
    ionInput.nativeElement.value = value;
    ionInput.triggerEventHandler('ionInput', { target: ionInput.nativeElement });
  };

  const fillForm = async (nationalId: string, password: string, confirmPassword: string): Promise<void> => {
    typeInto('Cédula', nationalId);
    typeInto('Contraseña', password);
    typeInto('Confirmar contraseña', confirmPassword);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    authFacadeMock = {
      register: vi.fn<AuthFacade['register']>(),
      isLoading: signal(false),
      error: signal<string | null>(null),
    };
    routerMock = { navigate: vi.fn<Router['navigate']>() };

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        { provide: AuthFacade, useValue: authFacadeMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // ngModel registra los controles de forma asíncrona; se refresca la vista con el estado del formulario
    await fixture.whenStable();
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
    expect(cedulaInput.componentInstance.required()).toBe(true);
    expect(cedulaInput.componentInstance.minlength()).toBe(5);
    expect(cedulaInput.componentInstance.maxlength()).toBe(20);
  });

  it('should have password input with correct validation', () => {
    const passwordInput = fixture.debugElement.query(By.css('app-input[label="Contraseña"]'));
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.componentInstance.required()).toBe(true);
    expect(passwordInput.componentInstance.minlength()).toBe(6);
    expect(passwordInput.componentInstance.maxlength()).toBe(50);
  });

  it('should have confirm password input with correct validation', () => {
    const confirmInput = fixture.debugElement.query(By.css('app-input[label="Confirmar contraseña"]'));
    expect(confirmInput).toBeTruthy();
    expect(confirmInput.componentInstance.required()).toBe(true);
  });

  it('should show error when passwords do not match', async () => {
    await fillForm('', 'password123', 'different');

    expect(component.passwordMismatch()).toBe(true);
  });

  it('should not show error when passwords match', async () => {
    await fillForm('', 'password123', 'password123');

    expect(component.passwordMismatch()).toBe(false);
  });

  it('should disable submit button when passwords do not match', async () => {
    await fillForm('12345', 'password123', 'different');

    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.disabled()).toBe(true);
  });

  it('should enable submit button when form is valid and passwords match', async () => {
    await fillForm('12345', 'password123', 'password123');

    const button = fixture.debugElement.query(By.css('app-button-primary[type="submit"]'));
    expect(button.componentInstance.disabled()).toBe(false);
  });

  it('should call authFacade.register on form submit', async () => {
    authFacadeMock.register.mockResolvedValue(undefined);
    await fillForm('123456789', 'password123', 'password123');

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    await fixture.whenStable();

    expect(authFacadeMock.register).toHaveBeenCalledWith('123456789', 'password123');
  });

  it('should show the error inside the form on failure', async () => {
    authFacadeMock.register.mockImplementation(async () => {
      authFacadeMock.error.set('Error al crear cuenta');
      throw new Error('Error al crear cuenta');
    });
    await fillForm('123456789', 'password123', 'password123');

    const form = fixture.debugElement.query(By.css('form'));
    form.triggerEventHandler('ngSubmit', {});
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Error al crear cuenta');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.form-error')).nativeElement.textContent).toContain('Error al crear cuenta');
  });

  it('should navigate to login page on "Ingresar" click', () => {
    const loginLink = fixture.debugElement.query(By.css('.auth__switch ion-button'));
    loginLink.triggerEventHandler('click', {});
    expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login'], { replaceUrl: true });
  });

  it('should not ask for a profile photo (Design System §1.1)', () => {
    expect(fixture.debugElement.query(By.css('app-avatar'))).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Foto');
  });
});
