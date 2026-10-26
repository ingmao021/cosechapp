import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MonthCalendarComponent } from './month-calendar.component';

describe('MonthCalendarComponent', () => {
  let fixture: ComponentFixture<MonthCalendarComponent>;
  let component: MonthCalendarComponent;

  const days = () => fixture.debugElement.queryAll(By.css('.cal__day'));
  const dayButton = (n: number) => days().find((d) => d.nativeElement.textContent.trim() === String(n))!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MonthCalendarComponent] }).compileComponents();
    fixture = TestBed.createComponent(MonthCalendarComponent);
    component = fixture.componentInstance;
    // Octubre de 2026: el 1 cae jueves.
    fixture.componentRef.setInput('today', '2026-10-24');
    fixture.componentRef.setInput('min', '2026-10-05');
    fixture.componentRef.setInput('max', '2026-10-24');
    fixture.detectChanges();
  });

  it('opens on the month of the max date, starting the week on Monday', () => {
    expect(fixture.debugElement.query(By.css('.cal__month')).nativeElement.textContent).toContain('octubre');
    expect(days().length).toBe(31);
    // Lunes a miércoles quedan vacíos antes del jueves 1.
    expect(component.cells().slice(0, 4).map((c) => c?.day ?? null)).toEqual([null, null, null, 1]);
  });

  it('disables days before the minimum and after the maximum', () => {
    expect(dayButton(4).nativeElement.disabled).toBe(true);
    expect(dayButton(5).nativeElement.disabled).toBe(false);
    expect(dayButton(24).nativeElement.disabled).toBe(false);
    expect(dayButton(25).nativeElement.disabled).toBe(true);
  });

  it('emits the tapped day as YYYY-MM-DD', () => {
    const emitted: string[] = [];
    component.dateSelected.subscribe((d) => emitted.push(d));
    dayButton(9).triggerEventHandler('click', {});
    expect(emitted).toEqual(['2026-10-09']);
  });

  it('marks today, the selected day and the marker day for screen readers', () => {
    fixture.componentRef.setInput('value', '2026-10-09');
    fixture.componentRef.setInput('markers', [{ date: '2026-10-05', label: 'abriste la cosecha' }]);
    fixture.detectChanges();

    expect(dayButton(24).attributes['aria-current']).toBe('date');
    expect(dayButton(9).attributes['aria-pressed']).toBe('true');
    expect(dayButton(5).attributes['aria-label']).toContain('abriste la cosecha');
    expect(dayButton(5).query(By.css('.cal__dot'))).toBeTruthy();
  });

  it('does not navigate past the allowed range', () => {
    expect(component.canGoForward()).toBe(false);
    expect(component.canGoBack()).toBe(false);

    fixture.componentRef.setInput('min', '2026-08-15');
    fixture.detectChanges();
    expect(component.canGoBack()).toBe(true);
    component.shiftMonth(-1);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.cal__month')).nativeElement.textContent).toContain('septiembre');
  });
});
