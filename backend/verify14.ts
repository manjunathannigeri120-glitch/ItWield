import { AuthorizationRegistry } from './src/services/AuthorizationRegistry';
try {
  const result = AuthorizationRegistry.authorize('LEAD_RESEARCH', {});
  console.log('Result:', result);
} catch (e) {
  console.error('Error:', e);
}
