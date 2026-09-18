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
