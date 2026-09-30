import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppButtonPrimaryComponent } from './app-button-primary.component';
import { By } from '@angular/platform-browser';

describe('AppButtonPrimaryComponent', () => {
  let component: AppButtonPrimaryComponent;
  let fixture: ComponentFixture<AppButtonPrimaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppButtonPrimaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppButtonPrimaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render button with content', () => {
    fixture.componentRef.setInput('type', 'button');
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('ion-button'));
    expect(button).toBeTruthy();
  });

  it('should emit buttonClick when clicked', () => {
    const emitSpy = vi.spyOn(component.buttonClick, 'emit');
    const button = fixture.debugElement.query(By.css('ion-button'));
    button.triggerEventHandler('click', new Event('click'));
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should not emit buttonClick when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.buttonClick, 'emit');
    const button = fixture.debugElement.query(By.css('ion-button'));
    button.triggerEventHandler('click', new Event('click'));
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit buttonClick when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.buttonClick, 'emit');
    const button = fixture.debugElement.query(By.css('ion-button'));
    button.triggerEventHandler('click', new Event('click'));
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should show loading spinner when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('loadingText', 'Cargando...');
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('ion-icon[name="refresh-circle-outline"]'));
    expect(spinner).toBeTruthy();
    expect(spinner.nativeElement.classList.contains('spin')).toBe(true);
  });

  it('should show start icon when provided', () => {
    fixture.componentRef.setInput('iconStart', 'log-in-outline');
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('ion-icon[slot="start"]'));
    expect(icon).toBeTruthy();
    expect(icon.nativeElement.name).toBe('log-in-outline');
  });

  it('should apply danger color when set', () => {
    fixture.componentRef.setInput('color', 'danger');
    fixture.detectChanges();

    expect(component.color()).toBe('danger');
  });

  it('should apply outline fill when set', () => {
    fixture.componentRef.setInput('fill', 'outline');
    fixture.detectChanges();

    expect(component.fill()).toBe('outline');
  });
});