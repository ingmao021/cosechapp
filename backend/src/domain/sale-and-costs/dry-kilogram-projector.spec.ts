import { DryKilogramProjector } from './dry-kilogram-projector';

describe('DryKilogramProjector', () => {
  it('should project cherry kilograms to dry kilograms using factor 5', () => {
    expect(DryKilogramProjector.project(100)).toBe(20);
    expect(DryKilogramProjector.project(50)).toBe(10);
    expect(DryKilogramProjector.project(0)).toBe(0);
    expect(DryKilogramProjector.project(1)).toBe(0.2);
    expect(DryKilogramProjector.project(5)).toBe(1);
  });

  it('should return conversion factor', () => {
    expect(DryKilogramProjector.getConversionFactor()).toBe(5);
  });

  it('should throw error for negative kilograms', () => {
    expect(() => DryKilogramProjector.project(-10)).toThrow('Cherry kilograms cannot be negative');
  });
});