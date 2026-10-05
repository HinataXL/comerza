CREATE TABLE "Vehicle" (
    id VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL,
    "customerId" VARCHAR(255) NOT NULL,
    plate VARCHAR(255) NOT NULL,
    vin VARCHAR(255),
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    year INTEGER,
    color VARCHAR(255),
    engine VARCHAR(255),
    mileage INTEGER,
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    CONSTRAINT fk_vehicle_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id),
    CONSTRAINT fk_vehicle_customer FOREIGN KEY ("customerId") REFERENCES "Customer"(id)
);

CREATE TABLE "TallerService" (
    id VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "defaultPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT fk_tallerservice_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id)
);

CREATE TABLE "WorkOrder" (
    id VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL,
    "customerId" VARCHAR(255) NOT NULL,
    "vehicleId" VARCHAR(255) NOT NULL,
    "assignedUserId" VARCHAR(255),
    "workOrderNumber" VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
    "entryMileage" INTEGER,
    "fuelLevel" VARCHAR(255),
    "customerComplaint" TEXT,
    "initialInspection" TEXT,
    diagnosis TEXT,
    "internalNotes" TEXT,
    "customerNotes" TEXT,
    subtotal DOUBLE PRECISION DEFAULT 0,
    discount DOUBLE PRECISION DEFAULT 0,
    tax DOUBLE PRECISION DEFAULT 0,
    total DOUBLE PRECISION DEFAULT 0,
    "approvedSubtotal" DOUBLE PRECISION,
    "approvedDiscount" DOUBLE PRECISION,
    "approvedTax" DOUBLE PRECISION,
    "approvedTotal" DOUBLE PRECISION,
    "approvalMethod" VARCHAR(50),
    "approvedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "deliveredAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP,
    CONSTRAINT fk_workorder_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id),
    CONSTRAINT fk_workorder_customer FOREIGN KEY ("customerId") REFERENCES "Customer"(id),
    CONSTRAINT fk_workorder_vehicle FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"(id),
    CONSTRAINT fk_workorder_user FOREIGN KEY ("assignedUserId") REFERENCES "User"(id),
    CONSTRAINT uq_workorder_number UNIQUE ("tenantId", "workOrderNumber")
);

CREATE TABLE "WorkOrderItem" (
    id VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL,
    "workOrderId" VARCHAR(255) NOT NULL,
    "itemType" VARCHAR(50) NOT NULL,
    "productId" VARCHAR(255),
    "serviceId" VARCHAR(255),
    description TEXT,
    quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    discount DOUBLE PRECISION NOT NULL DEFAULT 0,
    subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
    status VARCHAR(50),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workorderitem_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id),
    CONSTRAINT fk_workorderitem_wo FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"(id),
    CONSTRAINT fk_workorderitem_product FOREIGN KEY ("productId") REFERENCES "Product"(id),
    CONSTRAINT fk_workorderitem_service FOREIGN KEY ("serviceId") REFERENCES "TallerService"(id)
);

CREATE TABLE "WorkOrderStatusHistory" (
    id VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL,
    "workOrderId" VARCHAR(255) NOT NULL,
    "previousStatus" VARCHAR(50),
    "newStatus" VARCHAR(50) NOT NULL,
    "changedById" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wosh_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id),
    CONSTRAINT fk_wosh_wo FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"(id),
    CONSTRAINT fk_wosh_user FOREIGN KEY ("changedById") REFERENCES "User"(id)
);

CREATE TABLE "PublicToken" (
    id VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL,
    "workOrderId" VARCHAR(255) NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "tokenType" VARCHAR(50) NOT NULL,
    "expiresAt" TIMESTAMP,
    revoked BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ptoken_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id),
    CONSTRAINT fk_ptoken_wo FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"(id)
);

-- Indices para rendimiento
CREATE INDEX idx_vehicle_tenant_plate ON "Vehicle" ("tenantId", plate);
CREATE INDEX idx_vehicle_tenant_vin ON "Vehicle" ("tenantId", vin);
CREATE INDEX idx_workorder_tenant_status ON "WorkOrder" ("tenantId", status);
CREATE INDEX idx_workorder_tenant_customer ON "WorkOrder" ("tenantId", "customerId");
CREATE INDEX idx_publictoken_hash ON "PublicToken" ("tokenHash");
