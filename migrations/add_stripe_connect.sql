-- Add Stripe Connect fields to Restaurant table
ALTER TABLE "Restaurant" ADD COLUMN "stripeAccountId" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN "stripeOnboarded" BOOLEAN DEFAULT false;

-- Add unique constraint for stripeAccountId
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_stripeAccountId_key" UNIQUE ("stripeAccountId");