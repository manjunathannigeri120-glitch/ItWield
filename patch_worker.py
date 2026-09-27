import re

with open('backend/src/api/workspaces.ts', 'r') as f:
    c = f.read()

# Replace the Builder Analyst seed to include DATA_TRANSFORMATION
c = c.replace(
    "await insertWorker('Builder Analyst', 'You research and build new features.', ctoId, ['GITHUB_LIST_REPOSITORIES', 'GITHUB_LIST_ISSUES', 'GITHUB_LIST_PULL_REQUESTS', 'GITHUB_GET_REPOSITORY_ACTIVITY', 'GITHUB_GET_ISSUE', 'GITHUB_GET_PULL_REQUEST']);",
    "await insertWorker('Builder Analyst', 'You research and build new features.', ctoId, ['GITHUB_LIST_REPOSITORIES', 'GITHUB_LIST_ISSUES', 'GITHUB_LIST_PULL_REQUESTS', 'GITHUB_GET_REPOSITORY_ACTIVITY', 'GITHUB_GET_ISSUE', 'GITHUB_GET_PULL_REQUEST', 'DATA_TRANSFORMATION']);"
)

with open('backend/src/api/workspaces.ts', 'w') as f:
    f.write(c)

# Create the migration file
migration_sql = """-- V3.9.2 HOTFIX: Add DATA_TRANSFORMATION capability to Builder Analyst

UPDATE public.agents
SET capabilities = array_append(capabilities, 'DATA_TRANSFORMATION')
WHERE name = 'Builder Analyst'
  AND NOT ('DATA_TRANSFORMATION' = ANY(capabilities));
"""

with open('backend/supabase/migrations/0032_v392_data_transformation_capability.sql', 'w') as f:
    f.write(migration_sql)

