CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "Tenant" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "qpayproApiKey" VARCHAR(255),
    "qpayproApiSecret" VARCHAR(255),
    "isQpayproActive" BOOLEAN DEFAULT false,
    "recurrenteSecretKey" VARCHAR(255),
    "recurrenteTerminalId" VARCHAR(255),
    "isRecurrenteActive" BOOLEAN DEFAULT false,
    "logoUrl" VARCHAR(255),
    "receiptTemplate" VARCHAR(50) DEFAULT 'CLASSIC',
    "plan" VARCHAR(50) DEFAULT 'PRO',
    "reservationNotificationType" VARCHAR(50) DEFAULT 'EMAIL',
    "isActive" BOOLEAN DEFAULT true,
    "status" VARCHAR(50) DEFAULT 'PENDING_PAYMENT',
    "nit" VARCHAR(255),
    "responsibleName" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "User" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "role" VARCHAR(50) DEFAULT 'SELLER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Customer" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Product" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Sale" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "userId" VARCHAR(255) NOT NULL REFERENCES "User"("id"),
    "customerId" VARCHAR(255) REFERENCES "Customer"("id"),
    "total" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "paymentMethod" VARCHAR(255),
    "felStatus" VARCHAR(255),
    "qpayproTransactionId" VARCHAR(255),
    "paymentLink" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "SaleItem" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "saleId" VARCHAR(255) NOT NULL REFERENCES "Sale"("id") ON DELETE CASCADE,
    "productId" VARCHAR(255) NOT NULL REFERENCES "Product"("id"),
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "PlanConfig" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "features" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "AuditLog" (
    "id" VARCHAR(255) PRIMARY KEY,
    "action" VARCHAR(255) NOT NULL,
    "actorId" VARCHAR(255) NOT NULL,
    "targetId" VARCHAR(255),
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Notification" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) DEFAULT 'INFO',
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Plan" (
    "id" VARCHAR(255) PRIMARY KEY,
    "code" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(50) DEFAULT 'GTQ',
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "recurrentePlanId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Subscription" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "planId" VARCHAR(255) NOT NULL REFERENCES "Plan"("id"),
    "provider" VARCHAR(255) NOT NULL,
    "providerSubscriptionId" VARCHAR(255),
    "providerCustomerId" VARCHAR(255),
    "status" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(50) NOT NULL,
    "billingCycle" VARCHAR(50) NOT NULL,
    "checkoutUrl" VARCHAR(255),
    "startedAt" TIMESTAMP(3),
    "nextPaymentAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rawGatewayResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "SubscriptionEvent" (
    "id" VARCHAR(255) PRIMARY KEY,
    "subscriptionId" VARCHAR(255) REFERENCES "Subscription"("id"),
    "tenantId" VARCHAR(255),
    "provider" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(255) NOT NULL,
    "providerEventId" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("provider", "providerEventId")
);

CREATE TABLE "Reservation" (
    "id" VARCHAR(255) PRIMARY KEY,
    "tenantId" VARCHAR(255) NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
    "customerId" VARCHAR(255) NOT NULL REFERENCES "Customer"("id"),
    "title" VARCHAR(255),
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "SystemLog" (
    "id" VARCHAR(255) PRIMARY KEY,
    "level" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "user" VARCHAR(255),
    "ip" VARCHAR(255),
    "path" VARCHAR(255),
    "origin" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
