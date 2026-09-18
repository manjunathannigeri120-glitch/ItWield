-- V0.1 Initial Schema for Dovia

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Workspaces
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Workspace Members
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 4. Agents
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  system_prompt text,
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  temperature numeric DEFAULT 0.7,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Agent Runs
CREATE TABLE public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running',
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_ms integer,
  model text,
  input_tokens integer,
  output_tokens integer,
  error text,
  created_at timestamp with time zone DEFAULT now()
);

-- Row Level Security (RLS) setup

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Workspaces Policies
-- A user can select a workspace if they are the owner or a member
CREATE POLICY "Users can view workspaces they belong to" ON public.workspaces FOR SELECT USING (
  owner_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = id AND wm.user_id = auth.uid())
);
CREATE POLICY "Users can create workspaces" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their workspaces" ON public.workspaces FOR UPDATE USING (auth.uid() = owner_id);

-- Workspace Members Policies
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
);
-- For V0.1, we'll keep member management simple (owners can add)
CREATE POLICY "Workspace owners can manage members" ON public.workspace_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
);

-- Agents Policies
CREATE POLICY "Users can view agents in their workspaces" ON public.agents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
);
CREATE POLICY "Users can manage agents in their workspaces" ON public.agents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid())))
);

-- Conversations Policies
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their conversations" ON public.conversations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their conversations" ON public.conversations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their conversations" ON public.conversations FOR DELETE USING (user_id = auth.uid());

-- Messages Policies
CREATE POLICY "Users can view messages of their conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can create messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);

-- Agent Runs Policies
CREATE POLICY "Users can view runs of their agents" ON public.agent_runs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);
-- Note: inserting agent runs will be done securely by the backend using a service role key if needed, or by relying on RLS passing through the user's JWT.
CREATE POLICY "Users can insert runs for their conversations" ON public.agent_runs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can update runs for their conversations" ON public.agent_runs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to create a default workspace for a new user
CREATE OR REPLACE FUNCTION public.handle_new_workspace() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Workspace');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_workspace();
-- V0.2 Schema Updates for Tools and Events

-- 1. Agent Tools
CREATE TABLE public.agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(agent_id, tool_name)
);

-- 2. Agent Run Events
CREATE TABLE public.agent_run_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- e.g., 'agent_started', 'tool_requested', 'tool_completed'
  tool_name text,
  duration_ms integer,
  details jsonb, -- safe operational metadata
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Setup
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_run_events ENABLE ROW LEVEL SECURITY;

-- Agent Tools Policies
CREATE POLICY "Users can view tools of agents in their workspaces" ON public.agent_tools FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agents a JOIN public.workspaces w ON a.workspace_id = w.id WHERE a.id = agent_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid())))
);
CREATE POLICY "Users can manage tools of agents in their workspaces" ON public.agent_tools FOR ALL USING (
  EXISTS (SELECT 1 FROM public.agents a JOIN public.workspaces w ON a.workspace_id = w.id WHERE a.id = agent_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid())))
);

-- Agent Run Events Policies
CREATE POLICY "Users can view events of their runs" ON public.agent_run_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agent_runs r JOIN public.conversations c ON r.conversation_id = c.id WHERE r.id = run_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users can insert events for their runs" ON public.agent_run_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.agent_runs r JOIN public.conversations c ON r.conversation_id = c.id WHERE r.id = run_id AND c.user_id = auth.uid())
);
-- Enable pgvector extension for embedding search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create Knowledge Bases table
CREATE TABLE knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Agent-to-Knowledge-Base Junction Table
CREATE TABLE agent_knowledge_bases (
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  PRIMARY KEY (agent_id, knowledge_base_id)
);

-- Create Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id UUID NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT, -- Nullable initially, updated when uploaded to Supabase Storage
  status TEXT NOT NULL DEFAULT 'uploaded', -- uploaded, processing, ready, failed
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Document Chunks (for embeddings)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- Default OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create storage bucket for knowledge base documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kb_documents', 'kb_documents', false) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Knowledge Bases
CREATE POLICY "Users can view their workspace knowledge bases"
  ON knowledge_bases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = knowledge_bases.workspace_id 
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert knowledge bases in their workspace"
  ON knowledge_bases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = knowledge_bases.workspace_id 
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their workspace knowledge bases"
  ON knowledge_bases FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = knowledge_bases.workspace_id 
      AND w.owner_id = auth.uid()
    )
  );

-- RLS Policies for Agent Knowledge Bases Junction
CREATE POLICY "Users can view agent KBs in their workspace"
  ON agent_knowledge_bases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      JOIN workspaces w ON a.workspace_id = w.id
      WHERE a.id = agent_knowledge_bases.agent_id 
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agent KBs in their workspace"
  ON agent_knowledge_bases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents a
      JOIN workspaces w ON a.workspace_id = w.id
      WHERE a.id = agent_knowledge_bases.agent_id 
      AND w.owner_id = auth.uid()
    )
  );

-- RLS Policies for Documents
CREATE POLICY "Users can view their documents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_bases kb
      JOIN workspaces w ON kb.workspace_id = w.id
      WHERE kb.id = documents.knowledge_base_id 
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_bases kb
      JOIN workspaces w ON kb.workspace_id = w.id
      WHERE kb.id = documents.knowledge_base_id 
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_bases kb
      JOIN workspaces w ON kb.workspace_id = w.id
      WHERE kb.id = documents.knowledge_base_id 
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents"
  ON documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_bases kb
      JOIN workspaces w ON kb.workspace_id = w.id
      WHERE kb.id = documents.knowledge_base_id 
      AND w.owner_id = auth.uid()
    )
  );

-- RLS Policies for Document Chunks
CREATE POLICY "Users can view their document chunks"
  ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN knowledge_bases kb ON d.knowledge_base_id = kb.id
      JOIN workspaces w ON kb.workspace_id = w.id
      WHERE d.id = document_chunks.document_id 
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert document chunks"
  ON document_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN knowledge_bases kb ON d.knowledge_base_id = kb.id
      JOIN workspaces w ON kb.workspace_id = w.id
      WHERE d.id = document_chunks.document_id 
      AND w.owner_id = auth.uid()
    )
  );

-- RLS Policies for Storage
CREATE POLICY "Users can access their workspace documents in storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kb_documents' AND
    EXISTS (
      SELECT 1 FROM documents d
      JOIN knowledge_bases kb ON d.knowledge_base_id = kb.id
      JOIN workspaces w ON kb.workspace_id = w.id
      WHERE d.storage_path = name
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents to storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kb_documents' AND
    EXISTS (
      SELECT 1 FROM workspaces w
      -- The storage path will be formatted as `workspace_id/document_id/filename`
      WHERE (string_to_array(name, '/'))[1]::uuid = w.id
      AND w.owner_id = auth.uid()
    )
  );

-- Function to match document chunks via cosine similarity (STRICTLY AUTHORIZED BY AGENT ID)
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_agent_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  document_name text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    d.filename as document_name,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  JOIN agent_knowledge_bases akb ON d.knowledge_base_id = akb.knowledge_base_id
  WHERE akb.agent_id = p_agent_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
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
alter table workflows add column if not exists next_run_at timestamptz;
CREATE TABLE IF NOT EXISTS workspace_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    collection_key TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workspace_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace_data in their workspaces"
    ON workspace_data FOR ALL
    USING (workspace_id IN (
        SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    ));

CREATE INDEX idx_workspace_data_workspace_id ON workspace_data(workspace_id);
CREATE INDEX idx_workspace_data_collection_key ON workspace_data(collection_key);
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected',
    credentials TEXT NOT NULL, -- Encrypted credentials
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access connections in their workspaces"
    ON connections FOR ALL
    USING (
        workspace_id IN (SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()) OR
        workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    );

CREATE INDEX idx_connections_workspace_id ON connections(workspace_id);
CREATE INDEX idx_connections_provider ON connections(provider);
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_token TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    redirect_to TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Note: oauth_states is mostly used by the backend service role, but we can secure it anyway.
CREATE POLICY "Users can access their own oauth states"
    ON oauth_states FOR ALL
    USING (user_id = auth.uid());

CREATE INDEX idx_oauth_states_token ON oauth_states(state_token);
CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);
-- V1.3 Production Hardening: Performance indexes
-- Adding indexes identified during the database performance audit.

-- workflow_runs: missing index on status (used in retry checks)
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_started_at ON workflow_runs(started_at DESC);

-- workflows: next_run_at is queried every 10s by the scheduler
CREATE INDEX IF NOT EXISTS idx_workflows_next_run_at ON workflows(next_run_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_workflows_workspace_id ON workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);

-- workspace_data: workspace_id + collection_key lookup
CREATE INDEX IF NOT EXISTS idx_workspace_data_workspace_collection ON workspace_data(workspace_id, collection_key);

-- oauth_states: already has indexes from 0008, this is a safety no-op
-- (idx_oauth_states_token and idx_oauth_states_expires already exist)

-- Cleanup expired oauth_states automatically (best-effort; real cleanup happens on callback)
-- We don't add a cron here; the backend already deletes states on use.
-- This index helps bulk cleanup queries if ever needed.
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON oauth_states(user_id);
