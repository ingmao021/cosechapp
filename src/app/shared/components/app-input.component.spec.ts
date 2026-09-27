import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppInputComponent } from './app-input.component';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('AppInputComponent', () => {
  let component: AppInputComponent;
  let fixture: ComponentFixture<AppInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppInputComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AppInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label', () => {
    fixture.componentRef.setInput('label', 'Cédula');
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('ion-label'));
    expect(label.nativeElement.textContent).toContain('Cédula');
  });

  it('should emit valueChange on input', () => {
    const emitSpy = spyOn(component.valueChange, 'emit');
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('ion-input'));
    input.triggerEventHandler('ionInput', { target: { value: '12345' } });
    expect(emitSpy).toHaveBeenCalledWith('12345');
  });

  it('should show error when required and empty on blur', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('value', '');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('ion-input'));
    input.triggerEventHandler('ionBlur', {});
    fixture.detectChanges();

    expect(component.showError()).toBeTrue();
  });

  it('should not show error when valid value on blur', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('value', '12345');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('ion-input'));
    input.triggerEventHandler('ionBlur', {});
    fixture.detectChanges();

    expect(component.showError()).toBeFalse();
  });

  it('should toggle password visibility', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    expect(component.showPassword()).toBeFalse();

    const toggleButton = fixture.debugElement.query(By.css('ion-button[slot="end"]'));
    toggleButton.triggerEventHandler('click', {});
    fixture.detectChanges();

    expect(component.showPassword()).toBeTrue();
  });

  it('should respect minlength validation', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('minlength', 5);
    fixture.componentRef.setInput('value', '123');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('ion-input'));
    input.triggerEventHandler('ionBlur', {});
    fixture.detectChanges();

    expect(component.showError()).toBeTrue();
  });

  it('should respect maxlength validation', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('maxlength', 10);
    fixture.componentRef.setInput('value', '12345678901');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('ion-input'));
    input.triggerEventHandler('ionBlur', {});
    fixture.detectChanges();

    expect(component.showError()).toBeTrue();
  });
});