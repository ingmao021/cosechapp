-- Pagos de liquidación al cerrar la cosecha (no son pagos anticipados de quien se va)
ALTER TABLE "payments" ADD COLUMN "is_settlement" BOOLEAN NOT NULL DEFAULT false;
