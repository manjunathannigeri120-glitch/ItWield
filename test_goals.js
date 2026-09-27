const express = require('express');
const goalsRouter = require('./backend/src/api/goals').default;
const app = express();
app.use(express.json());

// Mock requireAuth
app.use((req, res, next) => {
  req.user = { id: 'test-user' };
  req.supabase = {
    from: (table) => {
      if (table === 'company_memory') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  limit: async () => ({ data: [], error: null })
                })
              })
            })
          })
        };
      }
      return {};
    }
  };
  next();
});

app.use('/workspaces/:workspaceId/goals', goalsRouter);

const request = require('supertest');

async function run() {
  const res = await request(app)
    .post('/workspaces/ws-1/goals')
    .send({ input: 'Get me 20 customers' });
  
  console.log(res.body);
}

run();
