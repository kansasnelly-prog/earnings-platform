import { updateFireUserForTesting } from './src/services/supabaseService.js';

console.log('Running updateFireUserForTesting...');
updateFireUserForTesting().then(result => {
  console.log('Result:', result);
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
