import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://rdwredkyhinhcspviqsl.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3JlZGt5aGluaGNzcHZpcXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTU4ODEsImV4cCI6MjA5NDU3MTg4MX0.0cKra9TLqJfl9w0KYkpFp4wGtnLGIZOGV1_-HTEzsp0');

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'Password123!'
  });
  console.log('Signup result:', error ? error.message : 'Success');
}

async function testRecovery() {
  const { error } = await supabase.auth.resetPasswordForEmail('supportitwield@gmail.com');
  console.log('Recovery result:', error ? error.message : 'Success');
}

testSignup().then(testRecovery);
