import { UpdateHarvestUseCase } from './update-harvest.use-case';
import { DeleteHarvestUseCase } from './delete-harvest.use-case';
import { UpdatePickerUseCase } from './update-picker.use-case';
import { DeletePickerUseCase } from './delete-picker.use-case';
import { HarvestRepository } from '../harvest.repository';
import { HarvestWorkerRepository } from '../harvest-worker.repository';
import { CrewRepository } from '../crew.repository';
import { Harvest } from '../harvest.entity';
import { HarvestWorker } from '../harvest-worker.entity';
import { Crew } from '../crew.entity';
import {
  CrewNotFoundError,
  HarvestAlreadyClosedError,
  HarvestHasPaymentsError,
  HarvestHasRecordsError,
  PickerHasRecordsError,
  PickerNotFoundError,
} from '@shared/errors/domain-errors';

const noRecords = { weighings: 0, payments: 0 };

describe('Harvest edit/delete and picker update/delete', () => {
  let harvests: jest.Mocked<HarvestRepository>;
  let pickers: jest.Mocked<HarvestWorkerRepository>;
  let crews: jest.Mocked<CrewRepository>;
  let harvest: Harvest;
  let picker: HarvestWorker;

  beforeEach(() => {
    harvest = Harvest.create('h1', 'farm-1', 'Primer pasón', 1200);
    picker = HarvestWorker.create('p1', 'h1', 'w1', null, 'c1');
    harvests = {
      save: jest.fn(async (h: Harvest) => h),
      findById: jest.fn(async (_id: string): Promise<Harvest | null> => harvest),
      findActiveByFarmId: jest.fn(),
      findAllByFarmId: jest.fn(),
      findByIdAndFarmId: jest.fn(),
      findAllByFarmIdWithStatus: jest.fn(),
      countRecords: jest.fn().mockResolvedValue(noRecords),
      delete: jest.fn(),
    };
    pickers = {
      save: jest.fn(async (p: HarvestWorker) => p),
      findById: jest.fn(),
      findByHarvestIdAndWorkerId: jest.fn(),
      findAllByHarvestId: jest.fn(),
      findAllByHarvestIdAndStatus: jest.fn(),
      findByIdAndHarvestId: jest.fn(async (_id: string, _harvestId: string): Promise<HarvestWorker | null> => picker),
      countRecords: jest.fn().mockResolvedValue(noRecords),
      delete: jest.fn(),
    };
    crews = {
      save: jest.fn(),
      findById: jest.fn(),
      findAllByHarvestId: jest.fn(),
      findByIdAndHarvestId: jest.fn(async (id: string) => (id === 'c2' ? Crew.create('c2', 'h1', 'Cuadrilla 2') : null)),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CrewRepository>;
  });

  describe('UpdateHarvestUseCase', () => {
    const useCase = () => new UpdateHarvestUseCase(harvests);

    it('renames and changes the price while there are no payments', async () => {
      const { harvest: updated } = await useCase().execute({ harvestId: 'h1', name: '  Mitaca 2026 ', pricePerKilogram: 1300 });

      expect(updated.name).toBe('Mitaca 2026');
      expect(updated.pricePerKilogram).toBe(1300);
    });

    it('keeps the price once there are payments, but still renames', async () => {
      harvests.countRecords.mockResolvedValue({ weighings: 3, payments: 1 });

      await expect(useCase().execute({ harvestId: 'h1', pricePerKilogram: 1300 })).rejects.toThrow(HarvestHasPaymentsError);
      const { harvest: renamed } = await useCase().execute({ harvestId: 'h1', name: 'Otro', pricePerKilogram: 1200 });
      expect(renamed.name).toBe('Otro');
    });

    it('rejects a closed harvest', async () => {
      harvest = harvest.close();

      await expect(useCase().execute({ harvestId: 'h1', name: 'X' })).rejects.toThrow(HarvestAlreadyClosedError);
    });
  });

  describe('DeleteHarvestUseCase', () => {
    it('deletes an active harvest without records', async () => {
      await new DeleteHarvestUseCase(harvests).execute({ harvestId: 'h1' });

      expect(harvests.delete).toHaveBeenCalledWith('h1');
    });

    it('refuses when it has weighings or payments', async () => {
      harvests.countRecords.mockResolvedValue({ weighings: 2, payments: 0 });

      await expect(new DeleteHarvestUseCase(harvests).execute({ harvestId: 'h1' })).rejects.toThrow(HarvestHasRecordsError);
      expect(harvests.delete).not.toHaveBeenCalled();
    });
  });

  describe('UpdatePickerUseCase', () => {
    const useCase = () => new UpdatePickerUseCase(pickers, crews);

    it('leaves a picker without crew', async () => {
      const { harvestWorker } = await useCase().execute({ harvestId: 'h1', pickerId: 'p1', crewId: null });

      expect(harvestWorker.crewId).toBeNull();
    });

    it('moves a picker to a crew of the same harvest', async () => {
      const { harvestWorker } = await useCase().execute({ harvestId: 'h1', pickerId: 'p1', crewId: 'c2' });

      expect(harvestWorker.crewId).toBe('c2');
    });

    it('rejects an unknown crew or picker', async () => {
      await expect(useCase().execute({ harvestId: 'h1', pickerId: 'p1', crewId: 'nope' })).rejects.toThrow(CrewNotFoundError);
      pickers.findByIdAndHarvestId.mockResolvedValue(null);
      await expect(useCase().execute({ harvestId: 'h1', pickerId: 'x', crewId: null })).rejects.toThrow(PickerNotFoundError);
    });

    it('clears the harvest alias without touching the crew', async () => {
      picker = picker.updateAlias('Juancho');

      const { harvestWorker } = await useCase().execute({ harvestId: 'h1', pickerId: 'p1', harvestAlias: null });

      expect(harvestWorker.harvestAlias).toBeNull();
      expect(harvestWorker.crewId).toBe('c1');
    });
  });

  describe('DeletePickerUseCase', () => {
    it('removes a picker without records', async () => {
      await new DeletePickerUseCase(pickers).execute({ harvestId: 'h1', pickerId: 'p1' });

      expect(pickers.delete).toHaveBeenCalledWith('p1');
    });

    it('refuses when the picker has payments', async () => {
      pickers.countRecords.mockResolvedValue({ weighings: 0, payments: 1 });

      await expect(new DeletePickerUseCase(pickers).execute({ harvestId: 'h1', pickerId: 'p1' })).rejects.toThrow(
        PickerHasRecordsError,
      );
    });
  });
});
