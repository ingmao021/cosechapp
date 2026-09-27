import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PayNowUseCase } from '@domain/payment/use-cases/pay-now.use-case';
import { PieceRateCalculator } from '@domain/payment/payment-calculator';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PayNowUseCase,
    {
      provide: 'PAYMENT_CALCULATOR',
      useClass: PieceRateCalculator,
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}