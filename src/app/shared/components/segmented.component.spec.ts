import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SegmentedComponent } from './segmented.component';

describe('SegmentedComponent', () => {
  let fixture: ComponentFixture<SegmentedComponent>;
  let component: SegmentedComponent;

  const options = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'other', label: 'Otro día' },
  ];
  const radios = () => fixture.debugElement.queryAll(By.css('[role="radio"]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SegmentedComponent] }).compileComponents();
    fixture = TestBed.createComponent(SegmentedComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('ariaLabel', 'Fecha de la venta');
    fixture.detectChanges();
  });

  it('renders one radio per option inside a labelled radiogroup', () => {
    const group = fixture.debugElement.query(By.css('[role="radiogroup"]'));
    expect(group.attributes['aria-label']).toBe('Fecha de la venta');
    expect(radios().map((r) => r.nativeElement.textContent.trim())).toEqual(['Hoy', 'Ayer', 'Otro día']);
  });

  it('marks only the current value as checked', () => {
    fixture.componentRef.setInput('value', 'yesterday');
    fixture.detectChanges();
    expect(radios().map((r) => r.attributes['aria-checked'])).toEqual(['false', 'true', 'false']);
  });

  it('emits the tapped value, even when it is already selected', () => {
    const emitted: string[] = [];
    component.selected.subscribe((v) => emitted.push(v));
    fixture.componentRef.setInput('value', 'other');
    fixture.detectChanges();

    radios()[2].triggerEventHandler('click', {});
    radios()[0].triggerEventHandler('click', {});
    expect(emitted).toEqual(['other', 'today']);
  });

  it('moves the selection with the arrow keys and wraps around', () => {
    const emitted: string[] = [];
    component.selected.subscribe((v) => emitted.push(v));
    fixture.componentRef.setInput('value', 'today');
    fixture.detectChanges();

    const group = fixture.debugElement.query(By.css('[role="radiogroup"]'));
    group.triggerEventHandler('keydown', { key: 'ArrowLeft', preventDefault: () => undefined, currentTarget: group.nativeElement });
    group.triggerEventHandler('keydown', { key: 'ArrowRight', preventDefault: () => undefined, currentTarget: group.nativeElement });
    expect(emitted).toEqual(['other', 'yesterday']);
  });
});
