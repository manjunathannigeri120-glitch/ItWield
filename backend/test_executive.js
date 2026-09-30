require('dotenv').config();
const { ExecutiveService } = require('./src/services/ExecutiveService');

async function testExecutive() {
  console.log('Testing Executive Runtime Connection...');
  
  // mock SupabaseClient and CompanyState
  const item = {
    id: 'test-item-001',
    assigned_executive_id: 'COO',
    title: 'What is the current company operating state?',
    description: 'Read-only request to evaluate operating state.',
    priority_reason: 'Testing runtime connection',
    evidence: { facts: ['company is stable'] }
  };
  
  const state = {};
  
  try {
    // We override analyzeAndPropose behavior to capture its output, but wait, analyzeAndPropose
    // writes to supabase. Let's just directly call it, but mock supabase so it doesn't fail.
    const mockSupabase = {
      from: () => ({
        insert: (data) => {
          console.log('--- RESPONSE SUCCESS ---');
          console.log(JSON.stringify(data, null, 2));
          return Promise.resolve({ error: null });
        }
      })
    };
    
    await ExecutiveService.analyzeAndPropose(mockSupabase, 'ws-test', item, state);
  } catch (error) {
    console.error('--- RESPONSE FAILED ---');
    console.error(error.message);
  }
}

testExecutive();
