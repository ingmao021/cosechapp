import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal, WritableSignal } from '@angular/core';
import { DashboardLedgerComponent } from './dashboard-ledger.component';
import { DashboardFacade } from '../services/dashboard.facade';

describe('DashboardLedgerComponent', () => {
  let fixture: ComponentFixture<DashboardLedgerComponent>;
  let value: WritableSignal<number | null>;
  let harvestProfit: WritableSignal<number | null>;

  const profit = () => fixture.debugElement.query(By.css('.profit'));
  const lines = () =>
    fixture.debugElement
      .queryAll(By.css('.line'))
      .map((line) => `${line.query(By.css('.line__op')).nativeElement.textContent.trim()} ${line.query(By.css('.line__name')).nativeElement.textContent.trim()}`.trim());

  beforeEach(async () => {
    value = signal<number | null>(3135600);
    harvestProfit = signal<number | null>(0);
    await TestBed.configureTestingModule({
      imports: [DashboardLedgerComponent],
      providers: [
        {
          provide: DashboardFacade,
          useValue: {
            estimatedValue: value,
            projectedDryKilograms: signal(156.78),
            pricePerDryKilogram: signal(20000),
            pickerPayments: signal(908680),
            totalPaid: signal(226480),
            pendingTotal: signal(682200),
            productionCosts: signal(0),
            estimatedGrossProfit: harvestProfit,
            estimatedHarvestProfit: harvestProfit,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardLedgerComponent);
    fixture.detectChanges();
  });

  it('reads like a notebook sum: value − payments = gross − costs = harvest profit', () => {
    expect(lines()).toEqual([
      'Valor de lo recogido',
      '− Pagos a recolectores',
      '= Ganancia bruta',
      '− Costos de producción',
      '= Ganancia de la cosecha',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Pagado $ 226.480');
    expect(fixture.nativeElement.textContent).toContain('Se registran al cerrar');
  });

  it('shows a zero harvest profit in a neutral color, not as a gain', () => {
    expect(profit().classes['gain']).toBeFalsy();
    expect(profit().classes['loss']).toBeFalsy();
  });

  it('marks a gain in green and a loss in red', () => {
    harvestProfit.set(150000);
    fixture.detectChanges();
    expect(profit().classes['gain']).toBe(true);

    harvestProfit.set(-20000);
    fixture.detectChanges();
    expect(profit().classes['loss']).toBe(true);
    expect(profit().classes['gain']).toBeFalsy();
  });

  it('never invents a value or a profit without an FNC price', () => {
    value.set(null);
    harvestProfit.set(null);
    fixture.detectChanges();
    expect(profit()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Sin precio FNC');
  });
});
