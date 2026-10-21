-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('WORKER', 'EMPLOYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "WorkerCategory" AS ENUM ('SKILLED', 'SEMI_SKILLED');

-- CreateEnum
CREATE TYPE "Trade" AS ENUM ('FITTER', 'TURNER', 'MACHINIST', 'WELDER', 'ELECTRICIAN', 'CNC_VMC_OPERATOR', 'WIREMAN', 'DIESEL_MECHANIC', 'HELPER', 'PACKER', 'LOADER', 'ASSEMBLY_LINE', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InteractionSource" AS ENUM ('WORKER_APPLY', 'EMPLOYER_HUNT');

-- CreateEnum
CREATE TYPE "InteractionStage" AS ENUM ('INITIATED', 'SHORTLISTED', 'OFFERED', 'JOINED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'hi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "category" "WorkerCategory" NOT NULL,
    "trade" "Trade" NOT NULL,
    "machineTags" TEXT[],
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "itiCertified" BOOLEAN NOT NULL DEFAULT false,
    "ncvtRollNumber" TEXT,
    "ncvtStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "aadhaarStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "currentState" TEXT NOT NULL,
    "currentDistrict" TEXT NOT NULL,
    "willingToRelocate" BOOLEAN NOT NULL DEFAULT true,
    "preferredStates" TEXT[],
    "expectedSalaryMonthly" INTEGER,
    "availableImmediately" BOOLEAN NOT NULL DEFAULT true,
    "skillVideoUrl" TEXT,
    "visibleInDirectory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "hrPhone" TEXT NOT NULL,
    "industrialCluster" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "gstin" TEXT,
    "udyamNumber" TEXT,
    "kybStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "huntCredits" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trade" "Trade" NOT NULL,
    "category" "WorkerCategory" NOT NULL,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "description" TEXT,
    "minExperienceYears" INTEGER NOT NULL DEFAULT 0,
    "grossSalaryMonthly" INTEGER NOT NULL,
    "inHandSalaryMonthly" INTEGER NOT NULL,
    "overtimeRatePerHour" INTEGER NOT NULL,
    "shiftHours" INTEGER NOT NULL DEFAULT 8,
    "hasHostel" BOOLEAN NOT NULL DEFAULT false,
    "hasCanteen" BOOLEAN NOT NULL DEFAULT false,
    "hasPfEsi" BOOLEAN NOT NULL DEFAULT false,
    "hasTravelAllowance" BOOLEAN NOT NULL DEFAULT false,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobInteraction" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "source" "InteractionSource" NOT NULL,
    "stage" "InteractionStage" NOT NULL DEFAULT 'INITIATED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentFeeReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT,
    "jobId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentFeeReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "OtpChallenge_phone_createdAt_idx" ON "OtpChallenge"("phone", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE INDEX "WorkerProfile_trade_visibleInDirectory_idx" ON "WorkerProfile"("trade", "visibleInDirectory");

-- CreateIndex
CREATE INDEX "WorkerProfile_currentState_idx" ON "WorkerProfile"("currentState");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerProfile_userId_key" ON "EmployerProfile"("userId");

-- CreateIndex
CREATE INDEX "JobPosting_status_trade_state_idx" ON "JobPosting"("status", "trade", "state");

-- CreateIndex
CREATE INDEX "JobPosting_employerId_idx" ON "JobPosting"("employerId");

-- CreateIndex
CREATE INDEX "JobInteraction_employerId_stage_idx" ON "JobInteraction"("employerId", "stage");

-- CreateIndex
CREATE INDEX "JobInteraction_workerId_idx" ON "JobInteraction"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "JobInteraction_jobId_workerId_key" ON "JobInteraction"("jobId", "workerId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInteraction" ADD CONSTRAINT "JobInteraction_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInteraction" ADD CONSTRAINT "JobInteraction_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobInteraction" ADD CONSTRAINT "JobInteraction_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentFeeReport" ADD CONSTRAINT "AgentFeeReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

