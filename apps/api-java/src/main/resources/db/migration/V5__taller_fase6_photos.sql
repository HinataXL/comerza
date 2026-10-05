-- Update WorkOrderPhoto structure
ALTER TABLE "WorkOrderPhoto" RENAME COLUMN "fileUrl" TO "storageKey";
ALTER TABLE "WorkOrderPhoto" ADD COLUMN "originalFilename" VARCHAR(255);
ALTER TABLE "WorkOrderPhoto" ADD COLUMN "contentType" VARCHAR(100);
ALTER TABLE "WorkOrderPhoto" ADD COLUMN "sizeBytes" BIGINT;
