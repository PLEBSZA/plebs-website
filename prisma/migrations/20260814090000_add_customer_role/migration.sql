-- Add CUSTOMER before it is used as a default. PostgreSQL cannot use a new
-- enum value in the same transaction that creates it, so this migration is
-- additive only. Existing admin rows are unchanged.

ALTER TYPE "AdminRole" ADD VALUE 'CUSTOMER';
