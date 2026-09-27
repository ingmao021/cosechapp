import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

import { WorkerService } from './worker.service';
import { CatalogWorker } from '@domain/worker/worker.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';

@ApiTags('workers')
@Controller('workers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new worker in the catalog' })
  async createWorker(@Request() req: any, @Body() dto: CreateWorkerDto) {
    const worker = await this.workerService.createWorker({
      coffeeGrowerId: req.user.userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      alias: dto.alias,
      phoneNumber: dto.phoneNumber,
    });
    return this.toResponse(worker);
  }

  @Get()
  @ApiOperation({ summary: 'List all workers in the catalog' })
  async listWorkers(@Request() req: any) {
    const workers = await this.workerService.listWorkers(req.user.userId);
    return workers.map(this.toResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a worker by ID' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  async getWorker(@Request() req: any, @Param('id') id: string) {
    const worker = await this.workerService.getWorker(id, req.user.userId);
    return this.toResponse(worker);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a worker' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  async updateWorker(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateWorkerDto) {
    const worker = await this.workerService.updateWorker({
      workerId: id,
      coffeeGrowerId: req.user.userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      alias: dto.alias,
      phoneNumber: dto.phoneNumber,
    });
    return this.toResponse(worker);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a worker from the catalog' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  async deleteWorker(@Request() req: any, @Param('id') id: string) {
    await this.workerService.deleteWorker(id, req.user.userId);
    return { success: true };
  }

  private toResponse(worker: CatalogWorker) {
    return {
      id: worker.id,
      firstName: worker.firstName,
      lastName: worker.lastName,
      alias: worker.alias,
      phoneNumber: worker.phoneNumber,
      displayName: worker.getDisplayName(),
      createdAt: worker.createdAt,
      updatedAt: worker.updatedAt,
    };
  }
}

export class CreateWorkerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  alias?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;
}

export class UpdateWorkerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  alias?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;
}