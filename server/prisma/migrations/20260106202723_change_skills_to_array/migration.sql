/*
  Warnings:

  - The `skills` column on the `alumni` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "alumni" DROP COLUMN "skills",
ADD COLUMN     "skills" TEXT[];
