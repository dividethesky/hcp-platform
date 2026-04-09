-- ============================================
-- Migration: Add job number and customer numeric ID columns
-- Run this after the initial schema.sql
-- ============================================

-- Add new columns to export_files
ALTER TABLE export_files ADD COLUMN IF NOT EXISTS customer_numeric_id TEXT;
ALTER TABLE export_files ADD COLUMN IF NOT EXISTS job_uuid TEXT;
ALTER TABLE export_files ADD COLUMN IF NOT EXISTS job_number TEXT;
ALTER TABLE export_files ADD COLUMN IF NOT EXISTS estimate_uuid TEXT;
ALTER TABLE export_files ADD COLUMN IF NOT EXISTS equipment_uuid TEXT;
