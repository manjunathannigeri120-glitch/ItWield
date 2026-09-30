import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: '../backend/.env'});

const supabaseAdmin = createClient('https://rdwredkyhinhcspviqsl.supabase.co', process.env.SUPABASE_SERVICE_KEY);
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTU4ODEsImV4cCI6MjA5NDU3MTg4MX0.0cKra9TLqJfl9w0KYkpFp4wGtnLGIZOGV1_-HTEzsp0');

async function testEmailFlows() {
  const email = 'test' + Date.now() + '@example.com';
  console.log('Creating user:', email);
  const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'Password123!',
    email_confirm: true
  });
  if (createError) {
    console.log('Create error:', createError.message);
    return;
  }

  console.log('User created successfully. Testing recovery email...');
  const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email);
  console.log('Recovery result:', recoveryError ? recoveryError.message : 'Success');
}

testEmailFlows();
