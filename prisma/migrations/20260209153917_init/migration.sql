-- CreateTable
CREATE TABLE "Capability" (
    "capabilityId" TEXT NOT NULL,
    "capabilityName" TEXT NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("capabilityId")
);

-- CreateTable
CREATE TABLE "Band" (
    "nameId" TEXT NOT NULL,
    "bandName" TEXT NOT NULL,

    CONSTRAINT "Band_pkey" PRIMARY KEY ("nameId")
);

-- CreateTable
CREATE TABLE "JobRole" (
    "jobRoleId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,

    CONSTRAINT "JobRole_pkey" PRIMARY KEY ("jobRoleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Capability_capabilityName_key" ON "Capability"("capabilityName");

-- CreateIndex
CREATE UNIQUE INDEX "Band_bandName_key" ON "Band"("bandName");

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("capabilityId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "Band"("nameId") ON DELETE RESTRICT ON UPDATE CASCADE;
