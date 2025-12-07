-- Check contract_status enum or constraint values
-- Run this to see what values are allowed for contract_status

-- Option 1: Check if it's an enum type
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%contract%'
ORDER BY e.enumsortorder;

-- Option 2: Check the CHECK constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'partners'::regclass
  AND conname LIKE '%contract%';

-- Option 3: Check the column definition
SELECT 
  column_name,
  data_type,
  udt_name,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'partners'
  AND column_name = 'contract_status';

-- Option 4: Try to see existing values in the table
SELECT DISTINCT contract_status
FROM partners
ORDER BY contract_status;

