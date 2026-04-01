/*
  Warnings:

  - You are about to drop the column `image_url` on the `listings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "listings" DROP COLUMN "image_url",
ADD COLUMN     "images" JSONB[];
