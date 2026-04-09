-- Migration 002: Add company_name to users for HCP org verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
