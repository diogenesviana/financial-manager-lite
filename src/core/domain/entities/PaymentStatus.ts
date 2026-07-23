export interface PaymentStatus {
  id: string;
  personId: string;
  month: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}
