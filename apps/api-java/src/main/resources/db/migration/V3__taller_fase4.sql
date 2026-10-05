ALTER TABLE "WorkOrder" ADD COLUMN "approvedItemsSnapshot" TEXT;
ALTER TABLE "PublicToken" ADD CONSTRAINT uq_publictoken_hash UNIQUE ("tokenHash");
ALTER TABLE "WorkOrderStatusHistory" ALTER COLUMN "changedById" DROP NOT NULL;
