#!/usr/bin/env node
/**
 * Nuclear reset script for queue state
 * Run with: node scripts/reset-queue-state.js
 */

console.log('🔄 Resetting all queue state...\n');

console.log('📋 Instructions to complete the reset:\n');

console.log('1️⃣  CLEAR DATABASE (run in your database client):');
console.log('   UPDATE user_preferences SET queue_state = NULL;');
console.log('');

console.log('2️⃣  CLEAR BROWSER (run in DevTools Console - F12):');
console.log('   localStorage.clear();');
console.log('   sessionStorage.clear();');
console.log('   location.reload();');
console.log('');

console.log('3️⃣  RESTART DEV SERVER:');
console.log('   Ctrl+C to stop current server');
console.log('   npm run dev');
console.log('');

console.log('4️⃣  After restarting, test:');
console.log('   - Add 3-5 tracks to queue');
console.log('   - Remove one track (X button)');
console.log('   - Click Next/Previous');
console.log('   - Check console for "[useAudioPlayer]" logs');
console.log('');

console.log('✅ If queue still doesn\'t work after this, the issue is deeper in the code.');
