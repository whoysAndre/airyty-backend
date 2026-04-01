/*
  Warnings:

  - Added the required column `guest_count` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "guest_count" INTEGER NOT NULL;
