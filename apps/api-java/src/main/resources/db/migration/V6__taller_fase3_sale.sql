-- Agregar descripción a SaleItem para productos genéricos (servicios/mano de obra)
ALTER TABLE "SaleItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "SaleItem" ADD COLUMN "description" TEXT;

-- Agregar referencia de venta a WorkOrder para FASE 3
ALTER TABLE "WorkOrder" ADD COLUMN "saleId" VARCHAR(255);
ALTER TABLE "WorkOrder" ADD CONSTRAINT "fk_work_order_sale" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE SET NULL;
