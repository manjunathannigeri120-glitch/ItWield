-- V3.9.2 HOTFIX: Add DATA_TRANSFORMATION capability to Builder Analyst
UPDATE public.agents
SET capabilities = (COALESCE(capabilities, '[]'::jsonb) - 'DATA_TRANSFORMATION') || '["DATA_TRANSFORMATION"]'::jsonb
WHERE name = 'Builder Analyst'
  AND NOT (COALESCE(capabilities, '[]'::jsonb) @> '"DATA_TRANSFORMATION"'::jsonb);
