import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal, WritableSignal } from '@angular/core';
import { DashboardHeroComponent } from './dashboard-hero.component';
import { DashboardFacade } from '../services/dashboard.facade';
import { HarvestFacade } from '../services/harvest.facade';
import { SyncFacade } from '../../sync/services/sync.facade';
import { NetworkService } from '../../network/services/network.service';

describe('DashboardHeroComponent', () => {
  let fixture: ComponentFixture<DashboardHeroComponent>;
  let harvestDay: WritableSignal<number>;
  let today: WritableSignal<number>;
  let yesterday: WritableSignal<number | null>;
  let pendingCount: WritableSignal<number>;

  const text = () => (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';

  beforeEach(async () => {
    harvestDay = signal(6);
    today = signal(157.3);
    yesterday = signal<number | null>(207);
    pendingCount = signal(0);
    await TestBed.configureTestingModule({
      imports: [DashboardHeroComponent],
      providers: [
        { provide: DashboardFacade, useValue: { harvestDay, todayKilograms: today, yesterdayKilograms: yesterday } },
        { provide: HarvestFacade, useValue: { activeHarvestName: signal('Traviesa 2026') } },
        { provide: SyncFacade, useValue: { pendingCount, lastSync: signal(null) } },
        { provide: NetworkService, useValue: { isOnline: signal(true) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardHeroComponent);
    fixture.detectChanges();
  });

  it('names the harvest, its day and today’s kilos', () => {
    expect(text()).toContain('Cosecha activa · Día 6');
    expect(text()).toContain('Traviesa 2026');
    expect(text()).toContain('157,3 kg hoy');
  });

  it('compares today with yesterday in words', () => {
    expect(text()).toContain('49,7 kg menos que ayer');
    expect(text()).toContain('Ayer: 207 kg');

    today.set(207);
    fixture.detectChanges();
    expect(text()).toContain('Igual que ayer');
  });

  it('on the first day there is no yesterday to compare with', () => {
    harvestDay.set(1);
    fixture.detectChanges();
    expect(text()).toContain('Primer día de la cosecha');
    expect(text()).not.toContain('Ayer:');
  });

  it('warns when weighings are still on the phone', () => {
    pendingCount.set(2);
    fixture.detectChanges();
    const status = fixture.debugElement.query(By.css('.hero__status'));
    expect(status.classes['hero__status--warn']).toBe(true);
    expect(status.nativeElement.textContent).toContain('2 pesadas por enviar');
  });

  it('Continuar asks the page to go on with the harvest', () => {
    const emitted: unknown[] = [];
    fixture.componentInstance.continue.subscribe(() => emitted.push(true));
    fixture.debugElement.query(By.css('.hero__continue')).triggerEventHandler('click', {});
    expect(emitted).toHaveLength(1);
  });
});
