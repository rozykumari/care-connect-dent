-- Add 'doctor' role to the enum (this must be committed first)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'doctor';