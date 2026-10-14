import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';

import { WorkerService } from './worker.service';
import { CatalogWorker } from '@domain/worker/worker.entity';
import { JwtAuthGuard } from '@infrastructure/http/auth/guards/jwt-auth.guard';
import { CreateWorkerDto, UpdateWorkerDto } from './worker.dto';

@Controller('workers')
@UseGuards(JwtAuthGuard)
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post()
  async createWorker(@Request() req: any, @Body() dto: CreateWorkerDto) {
    const worker = await this.workerService.createWorker({
      coffeeGrowerId: req.user.userId,
      firstName: dto.firstName,
      lastName: dto.lastName?.trim() ?? '',
      alias: dto.alias,
      phoneNumber: dto.phoneNumber,
    });
    return this.toResponse(worker);
  }

  @Get()
  async listWorkers(@Request() req: any) {
    const workers = await this.workerService.listWorkers(req.user.userId);
    return workers.map(this.toResponse);
  }

  @Get(':id')
  async getWorker(@Request() req: any, @Param('id') id: string) {
    const worker = await this.workerService.getWorker(id, req.user.userId);
    return this.toResponse(worker);
  }

  @Patch(':id')
  async updateWorker(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateWorkerDto) {
    const worker = await this.workerService.updateWorker({
      workerId: id,
      coffeeGrowerId: req.user.userId,
      firstName: dto.firstName,
      lastName: dto.lastName?.trim() ?? '',
      alias: dto.alias,
      phoneNumber: dto.phoneNumber,
    });
    return this.toResponse(worker);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWorker(@Request() req: any, @Param('id') id: string) {
    await this.workerService.deleteWorker(id, req.user.userId);
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
