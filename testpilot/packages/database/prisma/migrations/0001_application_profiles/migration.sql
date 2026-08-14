CREATE TABLE "ApplicationProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "targetUrls" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentSnapshotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntelligenceSnapshot" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "snapshotVersion" INTEGER NOT NULL,
    "sourceExecutionId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntelligenceSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntelligenceSnapshot_applicationId_snapshotVersion_key" ON "IntelligenceSnapshot"("applicationId", "snapshotVersion");
CREATE UNIQUE INDEX "IntelligenceSnapshot_applicationId_sourceExecutionId_key" ON "IntelligenceSnapshot"("applicationId", "sourceExecutionId");
CREATE INDEX "ApplicationProfile_updatedAt_idx" ON "ApplicationProfile"("updatedAt");
CREATE INDEX "IntelligenceSnapshot_applicationId_createdAt_idx" ON "IntelligenceSnapshot"("applicationId", "createdAt");
CREATE INDEX "IntelligenceSnapshot_sourceExecutionId_idx" ON "IntelligenceSnapshot"("sourceExecutionId");

ALTER TABLE "IntelligenceSnapshot" ADD CONSTRAINT "IntelligenceSnapshot_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ApplicationProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationProfile" ADD CONSTRAINT "ApplicationProfile_currentSnapshotId_fkey" FOREIGN KEY ("currentSnapshotId") REFERENCES "IntelligenceSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;