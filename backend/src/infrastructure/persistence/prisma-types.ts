// Prisma types for compilation without generated client
// This file provides the types needed for the Prisma repositories
// Once DATABASE_URL is available and prisma generate is run, this can be replaced

export type PrismaClient = any;

export type CoffeeGrower = {
  id: string;
  nationalId: string;
  passwordHash: string;
  profilePhoto: string | null;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export type Farm = {
  id: string;
  coffeeGrowerId: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export type Harvest = {
  id: string;
  farmId: string;
  name: string;
  pricePerKilogram: any; // Decimal
  status: HarvestStatus;
  openingDate: Date;
  closingDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export enum HarvestStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export type Worker = {
  id: string;
  coffeeGrowerId: string;
  firstName: string;
  lastName: string;
  alias: string | null;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export type HarvestPicker = {
  id: string;
  harvestId: string;
  workerId: string;
  harvestAlias: string | null;
  crewId: string | null;
  status: HarvestPickerStatus;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export enum HarvestPickerStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export type Crew = {
  id: string;
  harvestId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export type WeightRecord = {
  id: string;
  harvestPickerId: string;
  kilograms: any; // Decimal
  dateTime: Date;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export type Payment = {
  id: string;
  harvestPickerId: string;
  amount: any; // Decimal
  includesMeals: boolean;
  mealDetail: string | null;
  dateTime: Date;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export type ProductionCost = {
  id: string;
  harvestId: string;
  description: string;
  amount: any; // Decimal
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export type Sale = {
  id: string;
  harvestId: string;
  actualDryKilograms: any; // Decimal
  salePrice: any; // Decimal
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
};

export type CoffeePrice = {
  id: string;
  value: any; // Decimal
  queryDate: Date;
  createdAt: Date;
};

export type Notification = {
  id: string;
  coffeeGrowerId: string;
  type: NotificationType;
  date: Date;
  read: boolean;
  createdAt: Date;
};

export enum NotificationType {
  PRICE_CHANGE = 'PRICE_CHANGE',
}