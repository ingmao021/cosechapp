import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal, WritableSignal } from '@angular/core';
import { DashboardLedgerComponent } from './dashboard-ledger.component';
import { DashboardFacade } from '../services/dashboard.facade';

describe('DashboardLedgerComponent', () => {
  let fixture: ComponentFixture<DashboardLedgerComponent>;
  let harvestProfit: WritableSignal<number | null>;

  const profit = () => fixture.debugElement.query(By.css('.profit'));

  beforeEach(async () => {
    harvestProfit = signal<number | null>(0);
    await TestBed.configureTestingModule({
      imports: [DashboardLedgerComponent],
      providers: [
        {
          provide: DashboardFacade,
          useValue: {
            totalKilograms: signal(0),
            totalPaid: signal(0),
            pendingTotal: signal(0),
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

  it('never invents a profit without an FNC price', () => {
    harvestProfit.set(null);
    fixture.detectChanges();
    expect(profit()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Sin precio FNC');
  });
});
