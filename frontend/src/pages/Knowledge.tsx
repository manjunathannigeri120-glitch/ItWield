import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Database, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';

interface KnowledgeBase {
  id: string;
  name: string;
  created_at: string;
}

interface Document {
  id: string;
  filename: string;
  status: string;
  size_bytes: number;
  created_at: string;
}

export function Knowledge() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newKbName, setNewKbName] = useState('');
  const [selectedKb, setSelectedKb] = useState<string | null>(null);

  // 1. Fetch workspaces to get current workspace ID (using first for now)
  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      return res.data;
    }
  });

  const workspaceId = workspaces?.[0]?.id;

  // 2. Fetch Knowledge Bases
  const { data: kbs, isLoading: kbLoading } = useQuery<KnowledgeBase[]>({
    queryKey: ['knowledge_bases', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await api.get(`/knowledge/workspace/${workspaceId}`);
      return res.data;
    },
    enabled: !!workspaceId
  });

  // 3. Fetch Documents for Selected KB
  const { data: documents, isLoading: docLoading } = useQuery<Document[]>({
    queryKey: ['documents', selectedKb],
    queryFn: async () => {
      if (!selectedKb) return [];
      const res = await api.get(`/knowledge/${selectedKb}/documents`);
      return res.data;
    },
    enabled: !!selectedKb,
    refetchInterval: 3000 // Poll for document processing status
  });

  // Mutations
  const createKbMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!workspaceId) throw new Error('No workspace context');
      const res = await api.post(`/knowledge/workspace/${workspaceId}`, { name });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge_bases', workspaceId] });
      setNewKbName('');
      setSelectedKb(data.id);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Failed to create Knowledge Base');
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedKb) throw new Error('No KB selected');
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/knowledge/${selectedKb}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', selectedKb] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Failed to upload document');
    }
  });

  const handleCreateKb = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKbName.trim()) {
      createKbMutation.mutate(newKbName.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      uploadMutation.mutate(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 flex gap-8">
      {/* Left Column: Knowledge Bases */}
      <div className="w-1/3 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge</h1>
          <p className="text-muted-foreground mt-2">Manage internal data sources.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Bases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateKb} className="flex gap-2">
              <Input
                placeholder="New KB Name..."
                value={newKbName}
                onChange={(e) => setNewKbName(e.target.value)}
                disabled={createKbMutation.isPending}
              />
              <Button type="submit" size="icon" disabled={!newKbName.trim() || createKbMutation.isPending}>
                {createKbMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </form>

            <div className="space-y-2 pt-2 border-t">
              {kbLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : kbs?.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">No knowledge bases yet.</div>
              ) : (
                kbs?.map(kb => (
                  <div 
                    key={kb.id} 
                    onClick={() => setSelectedKb(kb.id)}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3 ${selectedKb === kb.id ? 'bg-primary/5 border-primary ring-1 ring-primary' : ''}`}
                  >
                    <Database className="w-4 h-4 text-primary" />
                    <div className="font-medium text-sm">{kb.name}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Documents */}
      <div className="flex-1">
        {selectedKb ? (
          <Card className="h-full border-dashed">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Upload text or markdown files to generate embeddings.</CardDescription>
              </div>
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".txt,.md,.csv" 
                  onChange={handleFileUpload}
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload File
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {docLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
              ) : documents?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Database className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  No documents in this Knowledge Base.
                </div>
              ) : (
                <div className="divide-y border rounded-lg">
                  {documents?.map(doc => (
                    <div key={doc.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{doc.filename}</p>
                          <p className="text-xs text-muted-foreground">{(doc.size_bytes / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        {doc.status === 'ready' ? (
                          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </div>
                        ) : doc.status === 'failed' ? (
                          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                            Failed
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                            <Loader2 className="w-3 h-3 animate-spin" /> Processing
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
            Select a Knowledge Base on the left
          </div>
        )}
      </div>
    </div>
  );
}
