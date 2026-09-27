import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: any;

  constructor() {
    // PrismaClient will be available after prisma generate
    // For now, we use a mock that will be replaced
    this.client = {
      $connect: async () => {},
      $disconnect: async () => {},
      coffeeGrower: {
        upsert: async () => {},
        findUnique: async () => null,
      },
      farm: {
        upsert: async () => {},
        findUnique: async () => null,
      },
      harvest: {
        upsert: async () => {},
        findUnique: async () => null,
        findFirst: async () => null,
        findMany: async () => [],
      },
      worker: {
        upsert: async () => {},
        findUnique: async () => null,
        findMany: async () => [],
        findFirst: async () => null,
        delete: async () => {},
      },
    };
  }

  getClient(): any {
    return this.client;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}