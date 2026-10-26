import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { signal, WritableSignal } from '@angular/core';
import { AlertController } from '@ionic/angular/alert-controller';
import { TabsPage } from './tabs.page';
import { HarvestFacade } from '@harvest/services/harvest.facade';

describe('TabsPage', () => {
  let fixture: ComponentFixture<TabsPage>;
  let router: Router;
  let hasActiveHarvest: WritableSignal<boolean>;
  let alertMock: { create: ReturnType<typeof vi.fn> };
  let present: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    hasActiveHarvest = signal(false);
    present = vi.fn().mockResolvedValue(undefined);
    alertMock = { create: vi.fn().mockResolvedValue({ present }) };

    await TestBed.configureTestingModule({
      imports: [TabsPage],
      providers: [
        provideRouter([]),
        { provide: HarvestFacade, useValue: { hasActiveHarvest, activeHarvestName: signal('Mitaca 2026') } },
        { provide: AlertController, useValue: alertMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(TabsPage);
    fixture.detectChanges();
  });

  it('shows four tabs with single-word labels and the Crear action', () => {
    const labels = fixture.debugElement.queryAll(By.css('ion-tab-button ion-label')).map((l) => l.nativeElement.textContent.trim());
    expect(labels).toEqual(['Inicio', 'Mercado', 'Historial', 'Perfil']);
    expect(fixture.debugElement.query(By.css('.tabs-create')).attributes['aria-label']).toBe('Crear: abrir cosecha');
  });

  it('opens the harvest form from Crear when there is no active harvest', async () => {
    fixture.debugElement.query(By.css('.tabs-create')).triggerEventHandler('click', {});
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/harvest/open']);
    expect(alertMock.create).not.toHaveBeenCalled();
  });

  it('explains instead of opening the form when a harvest is already open', async () => {
    hasActiveHarvest.set(true);
    fixture.debugElement.query(By.css('.tabs-create')).triggerEventHandler('click', {});
    await fixture.whenStable();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(alertMock.create).toHaveBeenCalledWith(expect.objectContaining({ header: 'Ya tienes una cosecha abierta' }));
    expect(present).toHaveBeenCalled();
  });
});
