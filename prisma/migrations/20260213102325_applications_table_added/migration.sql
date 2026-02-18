-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('IN_PROGRESS', 'REJECTED', 'ACCEPTED');

-- DropForeignKey
ALTER TABLE "JobRole" DROP CONSTRAINT "JobRole_statusId_fkey";

-- CreateTable
CREATE TABLE "Applications" (
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobRoleId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cvUrl" TEXT,

    CONSTRAINT "Applications_pkey" PRIMARY KEY ("applicationId")
);

-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("statusId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applications" ADD CONSTRAINT "Applications_jobRoleId_fkey" FOREIGN KEY ("jobRoleId") REFERENCES "JobRole"("jobRoleId") ON DELETE RESTRICT ON UPDATE CASCADE;
