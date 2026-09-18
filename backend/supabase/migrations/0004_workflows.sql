-- Workflows
create table if not exists workflows (
    id uuid default gen_random_uuid() primary key,
    workspace_id uuid references workspaces(id) on delete cascade not null,
    name text not null,
    status text default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
    definition jsonb not null default '{}'::jsonb,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

alter table workflows enable row level security;
create policy "Users can view workspace workflows" on workflows for select using (workspace_id in (select id from workspaces where owner_id = auth.uid()));
create policy "Users can insert workspace workflows" on workflows for insert with check (workspace_id in (select id from workspaces where owner_id = auth.uid()));
create policy "Users can update workspace workflows" on workflows for update using (workspace_id in (select id from workspaces where owner_id = auth.uid()));
create policy "Users can delete workspace workflows" on workflows for delete using (workspace_id in (select id from workspaces where owner_id = auth.uid()));

-- Workflow Runs
create table if not exists workflow_runs (
    id uuid default gen_random_uuid() primary key,
    workflow_id uuid references workflows(id) on delete cascade not null,
    status text default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
    trigger_data jsonb default '{}'::jsonb,
    execution_log jsonb default '[]'::jsonb,
    started_at timestamptz default now() not null,
    completed_at timestamptz
);

alter table workflow_runs enable row level security;
create policy "Users can view workflow runs" on workflow_runs for select using (workflow_id in (select id from workflows where workspace_id in (select id from workspaces where owner_id = auth.uid())));
create policy "Users can insert workflow runs" on workflow_runs for insert with check (workflow_id in (select id from workflows where workspace_id in (select id from workspaces where owner_id = auth.uid())));
create policy "Users can update workflow runs" on workflow_runs for update using (workflow_id in (select id from workflows where workspace_id in (select id from workspaces where owner_id = auth.uid())));
