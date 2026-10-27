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

  it('should render the label above the field and name the field with it', () => {
    fixture.componentRef.setInput('label', 'Cédula');
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('.field-label'));
    expect(label.nativeElement.textContent.trim()).toBe('Cédula');
    const ionInput = fixture.debugElement.query(By.css('ion-input'));
    expect(ionInput.attributes['aria-label']).toBe('Cédula');
  });

  it('should show a start icon only when one is given', () => {
    expect(fixture.debugElement.query(By.css('.field-icon'))).toBeNull();

    fixture.componentRef.setInput('iconStart', 'id-card-outline');
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('ion-icon.field-icon'));
    expect(icon).toBeTruthy();
    expect(icon.attributes['slot']).toBe('start');
  });

  it('should emit valueChange on input', () => {
    const emitSpy = vi.spyOn(component.valueChange, 'emit');
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
    input.triggerEventHandler('ionBlur', { target: input.nativeElement });
    fixture.detectChanges();

    expect(component.showError()).toBe(true);
  });

  it('should not show error when valid value on blur', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('value', '12345');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('ion-input'));
    input.triggerEventHandler('ionBlur', { target: input.nativeElement });
    fixture.detectChanges();

    expect(component.showError()).toBe(false);
  });

  it('should offer the show/hide toggle only for passwords', () => {
    expect(fixture.debugElement.query(By.css('ion-input-password-toggle'))).toBeNull();

    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    const toggle = fixture.debugElement.query(By.css('ion-input-password-toggle'));
    expect(toggle).toBeTruthy();
    expect(toggle.attributes['showLabel']).toBe('Mostrar contraseña');
  });

  it('should respect minlength validation', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('minlength', 5);
    fixture.componentRef.setInput('value', '123');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('ion-input'));
    input.triggerEventHandler('ionBlur', { target: input.nativeElement });
    fixture.detectChanges();

    expect(component.showError()).toBe(true);
  });

  describe('numbers: no dot while typing', () => {
    let modelValues: unknown[];
    const type = (typed: string) => {
      const native = document.createElement('input');
      native.value = typed;
      fixture.debugElement
        .query(By.css('ion-input'))
        .triggerEventHandler('ionInput', { target: { value: typed }, detail: { event: { target: native } } });
      fixture.detectChanges();
      return native;
    };

    beforeEach(() => {
      modelValues = [];
      component.registerOnChange((value) => modelValues.push(value));
    });

    it('integer (pesos) keeps only digits: "18.500" is 18500, never 18,5', () => {
      fixture.componentRef.setInput('type', 'integer');
      fixture.detectChanges();

      const native = type('18.500');

      expect(native.value).toBe('18500');
      expect(component.currentValue()).toBe('18500');
      expect(modelValues.at(-1)).toBe(18500);
      // El campo nativo es de texto: un input type="number" tomaría "18.500" como 18,5.
      expect((component as unknown as { nativeType(): string }).nativeType()).toBe('text');
    });

    it('integer gives null when empty and shows a written amount without dots', () => {
      fixture.componentRef.setInput('type', 'integer');
      fixture.detectChanges();

      type('');
      expect(modelValues.at(-1)).toBeNull();

      component.writeValue(1200);
      expect(component.currentValue()).toBe('1200');
    });

    it('decimal (kilos) turns a typed dot into the decimal comma', () => {
      fixture.componentRef.setInput('type', 'decimal');
      fixture.detectChanges();

      const native = type('25.5');

      expect(native.value).toBe('25,5');
      expect(modelValues.at(-1)).toBe(25.5);

      component.writeValue(12.75);
      expect(component.currentValue()).toBe('12,75');
    });

    it('decimal keeps one comma and up to 3 decimals', () => {
      fixture.componentRef.setInput('type', 'decimal');
      fixture.detectChanges();

      expect(type('1,2,3').value).toBe('1,23');
      expect(type('2,12345').value).toBe('2,123');
      expect(modelValues.at(-1)).toBe(2.123);
    });
  });

  it('should respect maxlength validation', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('maxlength', 10);
    fixture.componentRef.setInput('value', '12345678901');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('ion-input'));
    input.triggerEventHandler('ionBlur', { target: input.nativeElement });
    fixture.detectChanges();

    expect(component.showError()).toBe(true);
  });
});