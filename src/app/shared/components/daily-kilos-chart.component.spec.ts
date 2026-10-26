import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DailyKilosChartComponent, ChartDay } from './daily-kilos-chart.component';

describe('DailyKilosChartComponent', () => {
  let fixture: ComponentFixture<DailyKilosChartComponent>;

  // Lunes 26 oct 2026 en Colombia.
  const days: ChartDay[] = [
    { date: '2026-10-20', kilograms: 0, inHarvest: false },
    { date: '2026-10-21', kilograms: 0, inHarvest: false },
    { date: '2026-10-22', kilograms: 12 },
    { date: '2026-10-23', kilograms: 80 },
    { date: '2026-10-24', kilograms: 0 },
    { date: '2026-10-25', kilograms: 20 },
    { date: '2026-10-26', kilograms: 40 },
  ];
  const cols = () => fixture.debugElement.queryAll(By.css('.col'));
  const values = () => fixture.debugElement.queryAll(By.css('.col__value')).map((v) => v.nativeElement.textContent.trim());

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-26T15:00:00Z'));
    await TestBed.configureTestingModule({ imports: [DailyKilosChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(DailyKilosChartComponent);
    fixture.componentRef.setInput('days', days);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('draws one column per day, with no bar before the harvest opened', () => {
    expect(cols()).toHaveLength(7);
    expect(fixture.debugElement.queryAll(By.css('.col__bar'))).toHaveLength(5);
    const labels = fixture.debugElement.queryAll(By.css('.days__label')).map((l) => l.nativeElement.textContent.trim());
    expect(labels).toEqual(['mar', 'mié', 'jue', 'vie', 'sáb', 'dom', 'Hoy']);
  });

  it('highlights today and labels only today and the highest day', () => {
    expect(cols()[6].classes['col--today']).toBe(true);
    expect(values()).toEqual(['80', '40']);
  });

  it('scales the bars to the highest day', () => {
    const bars = fixture.debugElement.queryAll(By.css('.col__bar')).map((b) => b.nativeElement.style.height);
    expect(bars).toEqual(['15%', '100%', '0%', '25%', '50%']);
  });

  it('shows the value of a tapped column, and hides it on a second tap', () => {
    cols()[5].triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(values()).toEqual(['80', '20', '40']);

    cols()[5].triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(values()).toEqual(['80', '40']);
  });

  it('reads every day of the harvest to screen readers', () => {
    const label = fixture.debugElement.query(By.css('[role="img"]')).attributes['aria-label'];
    expect(label).toBe('Kilos por día, últimos 7 días: jue 12 kg, vie 80 kg, sáb 0 kg, dom 20 kg, hoy 40 kg.');
  });
});
