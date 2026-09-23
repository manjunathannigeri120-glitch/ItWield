import express from 'express';
import agentRoutes from './src/api/agents';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const app = express();
  app.use(express.json());
  
  // Mock requireAuth to inject a real Supabase client scoped to the admin user
  app.use((req: any, res, next) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
    req.supabase = createClient(supabaseUrl, supabaseKey);
    req.user = { id: 'd7c54b95-5172-4879-acea-e5662df9e1a3' }; // NovaDesk admin maybe?
    next();
  });
  
  app.use('/api/v1/agents', agentRoutes);
  
  const server = app.listen(0, async () => {
    const port = (server.address() as any).port;
    const targetAgentId = 'd977e0a3-a674-442d-962c-ef407c194da0'; // NovaDesk CEO

    console.log('Sending request to', `http://localhost:${port}/api/v1/agents/${targetAgentId}/chat`);
    
    try {
      const resp = await fetch(`http://localhost:${port}/api/v1/agents/${targetAgentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello CEO' })
      });
      const data = await resp.json();
      console.log('Status:', resp.status);
      console.log('Body:', data);
    } catch (e: any) {
      console.error(e);
    } finally {
      server.close();
    }
  });
}

main().catch(console.error);
