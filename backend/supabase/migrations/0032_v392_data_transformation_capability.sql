-- V3.9.2 HOTFIX: Add DATA_TRANSFORMATION capability to Builder Analyst

UPDATE public.agents
SET capabilities = array_append(capabilities, 'DATA_TRANSFORMATION')
WHERE name = 'Builder Analyst'
  AND NOT ('DATA_TRANSFORMATION' = ANY(capabilities));
