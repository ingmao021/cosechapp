import { useCaseProvider } from '@infrastructure/http/use-case.provider';
import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PayNowUseCase } from '@domain/payment/use-cases/pay-now.use-case';
import { PieceRateCalculator } from '@domain/payment/payment-calculator';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { OwnershipModule } from '@infrastructure/http/ownership.module';

@Module({
  imports: [PersistenceModule, OwnershipModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    useCaseProvider(PayNowUseCase, ['PAYMENT_REPOSITORY', 'WEIGHING_REPOSITORY', 'HARVEST_WORKER_REPOSITORY', 'HARVEST_REPOSITORY', 'PAYMENT_CALCULATOR']),
    {
      provide: 'PAYMENT_CALCULATOR',
      useClass: PieceRateCalculator,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}