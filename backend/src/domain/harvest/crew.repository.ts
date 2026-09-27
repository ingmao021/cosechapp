import { Crew } from './crew.entity';

export interface CrewRepository {
  save(crew: Crew): Promise<Crew>;
  findById(id: string): Promise<Crew | null>;
  findAllByHarvestId(harvestId: string): Promise<Crew[]>;
  findByIdAndHarvestId(id: string, harvestId: string): Promise<Crew | null>;
  delete(id: string): Promise<void>;
}