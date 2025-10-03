-- Fix existing staff account to admin
-- Run this in Neon SQL Editor if you already created a staff account

-- First, check existing users
SELECT id, email, name, role FROM "User";

-- Update the staff user to admin (replace email with your actual email)
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, name, role FROM "User";
