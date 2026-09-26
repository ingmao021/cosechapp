import { Payment } from './payment.entity';

export interface PaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findAllByHarvestPickerId(harvestPickerId: string): Promise<Payment[]>;
  findTotalPaidByHarvestPickerId(harvestPickerId: string): Promise<number>;
}