export class DryKilogramProjector {
  private static readonly CONVERSION_FACTOR = 5;

  static project(cherryKilograms: number): number {
    if (cherryKilograms < 0) {
      throw new Error('Cherry kilograms cannot be negative');
    }
    return cherryKilograms / this.CONVERSION_FACTOR;
  }

  static getConversionFactor(): number {
    return this.CONVERSION_FACTOR;
  }
}