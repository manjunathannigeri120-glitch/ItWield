import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import multer from 'multer';
import OpenAI from 'openai';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const KBSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

let mockKBs: any[] = [];
let mockDocuments: any[] = [];

// Create Knowledge Base
router.post('/workspace/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const { workspaceId } = req.params;
    const validatedData = KBSchema.parse(req.body);

    if (!req.supabase) {
      const mockKB = {
        id: 'mock-kb-' + Date.now(),
        workspace_id: workspaceId,
        ...validatedData,
        created_at: new Date().toISOString()
      };
      mockKBs.unshift(mockKB);
      return res.json(mockKB);
    }

    const { data, error } = await req.supabase
      .from('knowledge_bases')
      .insert({
        workspace_id: workspaceId,
        ...validatedData
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List Knowledge Bases
router.get('/workspace/:workspaceId', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      return res.json(mockKBs.filter(kb => kb.workspace_id === req.params.workspaceId));
    }

    const { data, error } = await req.supabase
      .from('knowledge_bases')
      .select('*')
      .eq('workspace_id', req.params.workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List Documents for KB
router.get('/:kbId/documents', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      return res.json(mockDocuments.filter(d => d.knowledge_base_id === req.params.kbId));
    }

    const { data, error } = await req.supabase
      .from('documents')
      .select('*')
      .eq('knowledge_base_id', req.params.kbId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Upload Document
router.post('/:kbId/documents', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const kbId = req.params.kbId;
    const file = req.file;

    // MIME type validation
    if (!['text/plain', 'text/markdown'].includes(file.mimetype) && !file.originalname.endsWith('.md') && !file.originalname.endsWith('.txt')) {
      return res.status(400).json({ error: 'Unsupported file type. Only .txt and .md are allowed.' });
    }

    const textContent = file.buffer.toString('utf-8');

    if (textContent.trim().length === 0) {
      return res.status(400).json({ error: 'File is empty.' });
    }

    // In Mock Mode
    if (!req.supabase || !process.env.OPENAI_API_KEY) {
      const mockDoc = {
        id: 'mock-doc-' + Date.now(),
        knowledge_base_id: kbId,
        filename: file.originalname,
        content_type: file.mimetype,
        size_bytes: file.size,
        status: 'ready',
        created_at: new Date().toISOString()
      };
      mockDocuments.unshift(mockDoc);
      return res.json(mockDoc);
    }

    // 1. Create document record as "uploaded"
    const { data: doc, error: docError } = await req.supabase
      .from('documents')
      .insert({
        knowledge_base_id: kbId,
        filename: file.originalname,
        content_type: file.mimetype,
        size_bytes: file.size,
        status: 'uploaded'
      })
      .select()
      .single();

    if (docError) throw docError;

    // Send immediate response so frontend doesn't hang
    res.json(doc);

    // Process in background
    (async () => {
      try {
        // Fetch workspaceId to form the storage path
        const { data: kb } = await req.supabase!
          .from('knowledge_bases')
          .select('workspace_id')
          .eq('id', kbId)
          .single();

        if (!kb) throw new Error('Knowledge Base not found');

        const storagePath = `${kb.workspace_id}/${doc.id}/${file.originalname}`;

        // 2. Upload to Supabase Storage
        const { error: storageError } = await req.supabase!
          .storage
          .from('kb_documents')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });

        if (storageError) throw new Error(`Storage upload failed: ${storageError.message}`);

        // Update status to processing
        await req.supabase!
          .from('documents')
          .update({ status: 'processing', storage_path: storagePath })
          .eq('id', doc.id);

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        // Simple chunking (by paragraph)
        // Ensure chunks aren't massive. (Very basic implementation for V0.3 limits)
        const chunks = textContent.split(/\n\n+/).filter(c => c.trim().length > 10);
        
        let chunkIndex = 0;
        for (const chunk of chunks) {
          if (chunkIndex >= 500) break; // Limit chunks per doc to prevent API cost runaway
          
          const embeddingRes = await openai.embeddings.create({
            model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
            input: chunk,
            encoding_format: "float",
          });

          const embedding = embeddingRes.data[0].embedding;

          const { error: chunkError } = await req.supabase!
            .from('document_chunks')
            .insert({
              document_id: doc.id,
              chunk_index: chunkIndex++,
              content: chunk,
              embedding: `[${embedding.join(',')}]`
            });

          if (chunkError) {
             throw new Error(`Chunk insert failed: ${chunkError.message}`);
          }
        }

        // 3. Mark as ready
        await req.supabase!
          .from('documents')
          .update({ status: 'ready' })
          .eq('id', doc.id);

      } catch (err: any) {
        console.error('Background processing error:', err);
        await req.supabase!
          .from('documents')
          .update({ status: 'failed', error_message: err.message })
          .eq('id', doc.id);
      }
    })();

  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Document
router.delete('/documents/:docId', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      mockDocuments = mockDocuments.filter(d => d.id !== req.params.docId);
      return res.json({ success: true });
    }

    const { data: doc, error: fetchError } = await req.supabase
      .from('documents')
      .select('storage_path')
      .eq('id', req.params.docId)
      .single();

    if (fetchError || !doc) throw new Error('Document not found');

    if (doc.storage_path) {
      await req.supabase.storage.from('kb_documents').remove([doc.storage_path]);
    }

    const { error } = await req.supabase
      .from('documents')
      .delete()
      .eq('id', req.params.docId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete KB
router.delete('/:kbId', async (req: AuthRequest, res) => {
  try {
    if (!req.supabase) {
      mockKBs = mockKBs.filter(kb => kb.id !== req.params.kbId);
      mockDocuments = mockDocuments.filter(d => d.knowledge_base_id !== req.params.kbId);
      return res.json({ success: true });
    }

    const { error } = await req.supabase
      .from('knowledge_bases')
      .delete()
      .eq('id', req.params.kbId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
