-- Update WorkOrder
ALTER TABLE "WorkOrder" ADD COLUMN "qualityControlNotes" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "qualityControlledAt" TIMESTAMP;
ALTER TABLE "WorkOrder" ADD COLUMN "qualityControlledById" VARCHAR(255);
ALTER TABLE "WorkOrder" ADD COLUMN "exitMileage" INTEGER;
ALTER TABLE "WorkOrder" ADD COLUMN "deliveredById" VARCHAR(255);

ALTER TABLE "WorkOrder" ADD CONSTRAINT "fk_wo_qc_user" FOREIGN KEY ("qualityControlledById") REFERENCES "User"("id");
ALTER TABLE "WorkOrder" ADD CONSTRAINT "fk_wo_delivered_user" FOREIGN KEY ("deliveredById") REFERENCES "User"("id");

-- Create WorkOrderPhoto
CREATE TABLE "WorkOrderPhoto" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL,
    "workOrderId" VARCHAR(255) NOT NULL,
    "vehicleId" VARCHAR(255),
    "category" VARCHAR(50) NOT NULL,
    "fileUrl" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "uploadedById" VARCHAR(255) NOT NULL,
    "customerVisible" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_wo_photo_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id"),
    CONSTRAINT "fk_wo_photo_wo" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_wo_photo_vehicle" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL,
    CONSTRAINT "fk_wo_photo_user" FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
);

-- Create WorkOrderChecklistItem
CREATE TABLE "WorkOrderChecklistItem" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL,
    "workOrderId" VARCHAR(255) NOT NULL,
    "itemCode" VARCHAR(100) NOT NULL,
    "labelSnapshot" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    CONSTRAINT "fk_wo_checklist_tenant" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id"),
    CONSTRAINT "fk_wo_checklist_wo" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE
);
