import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SyncFacade } from './sync.facade';
import { OfflineStore } from './offline-store';
import { WeighingService } from '../../weighing/services/weighing.service';
import { NetworkService } from '../../network/services/network.service';
import { HarvestFacade } from '../../harvest/services/harvest.facade';

describe('SyncFacade (pesadas sin señal)', () => {
  let facade: SyncFacade;
  let store: OfflineStore;
  const online = signal(true);
  const weighingService = {
    recordWeighing: vi.fn(),
    syncWeighings: vi.fn(),
  };
  const harvestFacade = {
    applyLocalWeighing: vi.fn(),
    activeHarvest: signal<{ id: string } | null>({ id: 'harvest-1' }),
    loadPickers: vi.fn().mockResolvedValue(undefined),
  };
  const offline = () => throwError(() => new HttpErrorResponse({ status: 0 }));

  beforeEach(() => {
    localStorage.clear();
    online.set(true);
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: WeighingService, useValue: weighingService },
        { provide: NetworkService, useValue: { isOnline: online } },
        { provide: HarvestFacade, useValue: harvestFacade },
      ],
    });
    facade = TestBed.inject(SyncFacade);
    store = TestBed.inject(OfflineStore);
  });

  it('sends the weighing right away when online', async () => {
    weighingService.recordWeighing.mockReturnValue(of({}));

    const outcome = await facade.recordWeighing({ harvestPickerId: 'p1', kilograms: 12.5 });

    expect(outcome).toBe('sent');
    expect(store.pendingWeighings()).toEqual([]);
    const sent = weighingService.recordWeighing.mock.calls[0][0];
    expect(sent).toMatchObject({ harvestPickerId: 'p1', kilograms: 12.5 });
    expect(sent.id).toMatch(/^[0-9a-f-]{36}$/); // id del teléfono: el reenvío no duplica
  });

  it('queues the weighing and updates local totals when there is no connection', async () => {
    online.set(false);

    const outcome = await facade.recordWeighing({ harvestPickerId: 'p1', kilograms: 8 });

    expect(outcome).toBe('queued');
    expect(weighingService.recordWeighing).not.toHaveBeenCalled();
    expect(store.pendingWeighings()).toHaveLength(1);
    expect(facade.pendingCount()).toBe(1);
    expect(harvestFacade.applyLocalWeighing).toHaveBeenCalledWith('p1', 8);
  });

  it('queues the weighing when the request fails for lack of network', async () => {
    weighingService.recordWeighing.mockReturnValueOnce(offline()).mockReturnValue(offline());

    const outcome = await facade.recordWeighing({ harvestPickerId: 'p1', kilograms: 5 });

    expect(outcome).toBe('queued');
    expect(store.pendingWeighings()).toHaveLength(1);
  });

  it('does not queue a weighing the server rejects (shows the error instead)', async () => {
    weighingService.recordWeighing.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 422 })));

    await expect(facade.recordWeighing({ harvestPickerId: 'p1', kilograms: 5 })).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(store.pendingWeighings()).toEqual([]);
  });

  it('syncs the queue in one batch: saved ones leave, rejected ones are reported, 5xx stay for retry', async () => {
    online.set(false);
    store.enqueueWeighing({ id: 'a', harvestPickerId: 'p1', kilograms: 1, dateTime: '2026-10-01T10:00:00Z' });
    store.enqueueWeighing({ id: 'b', harvestPickerId: 'p2', kilograms: 2, dateTime: '2026-10-01T10:01:00Z' });
    store.enqueueWeighing({ id: 'c', harvestPickerId: 'p3', kilograms: 3, dateTime: '2026-10-01T10:02:00Z' });
    weighingService.syncWeighings.mockReturnValue(
      of({
        results: [
          { id: 'a', status: 201 },
          { id: 'b', status: 404, error: 'ResourceNotFoundError' },
          { id: 'c', status: 503 },
        ],
      }),
    );

    online.set(true);
    await facade.syncAll();

    expect(store.pendingWeighings().map((w) => w.id)).toEqual(['c']);
    expect(store.pendingWeighings()[0].attempts).toBe(1);
    expect(facade.rejected().map((w) => w.id)).toEqual(['b']);
    expect(facade.rejected()[0].reason).toContain('recolector');
    expect(harvestFacade.loadPickers).toHaveBeenCalledWith('harvest-1');
  });

  it('keeps everything queued if the batch cannot reach the server', async () => {
    store.enqueueWeighing({ id: 'a', harvestPickerId: 'p1', kilograms: 1, dateTime: '2026-10-01T10:00:00Z' });
    store.enqueueWeighing({ id: 'b', harvestPickerId: 'p1', kilograms: 2, dateTime: '2026-10-01T10:01:00Z' });
    weighingService.syncWeighings.mockReturnValue(offline());

    await facade.syncAll();

    expect(store.pendingWeighings().map((w) => [w.id, w.attempts])).toEqual([
      ['a', 1],
      ['b', 1],
    ]);
  });
});
