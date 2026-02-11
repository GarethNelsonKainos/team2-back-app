/*
  Warnings:

  - Added the required column `statusId` to the `JobRole` table without a default value. This is not possible if the table is not empty.

*/


-- CreateTable
CREATE TABLE "Status" (
    "statusId" TEXT NOT NULL,
    "statusName" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("statusId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Status_statusName_key" ON "Status"("statusName");

INSERT INTO "Status" ("statusId", "statusName") VALUES (gen_random_uuid(), 'Open');
INSERT INTO "Status" ("statusId", "statusName") VALUES (gen_random_uuid(), 'Closed');
INSERT INTO "Status" ("statusId", "statusName") VALUES (gen_random_uuid(), 'In Progress');

-- AlterTable
ALTER TABLE "JobRole" ADD COLUMN "statusId" TEXT NOT NULL, ADD COLUMN "description" TEXT NULL, ADD COLUMN "responsibilities" TEXT NULL, ADD COLUMN "sharepointUrl" TEXT NULL, ADD COLUMN "numberOfOpenPositions" INT NULL;


-- AddForeignKey
ALTER TABLE "JobRole" ADD CONSTRAINT "JobRole_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("statusId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Band"
RENAME COLUMN "nameId" TO "bandId";