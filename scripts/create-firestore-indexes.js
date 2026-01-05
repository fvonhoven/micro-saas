#!/usr/bin/env node

/**
 * Generate Firestore Index Creation URLs
 * 
 * This script generates direct URLs to create Firestore composite indexes
 * in the Firebase Console. Click the URLs to automatically create the indexes.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateIndexUrl(projectId, collectionId, fields) {
  const baseUrl = `https://console.firebase.google.com/project/${projectId}/firestore/indexes`;
  
  // Create the index definition
  const fieldsParam = fields.map(f => `${f.field}:${f.order}`).join(',');
  
  return `${baseUrl}?create_composite=${collectionId}:${fieldsParam}`;
}

function printIndexUrls(projectId) {
  console.log('\n🔥 Firestore Index Creation URLs\n');
  console.log('Click these URLs to create the required indexes:\n');

  // CronGuard indexes
  console.log('📊 CronGuard Monitors:');
  console.log('1. monitors (userId + createdAt):');
  console.log(`   ${generateIndexUrl(projectId, 'monitors', [
    { field: 'userId', order: 'ASCENDING' },
    { field: 'createdAt', order: 'DESCENDING' }
  ])}\n`);

  console.log('2. monitors (status + nextExpectedAt) - CRITICAL for performance:');
  console.log(`   ${generateIndexUrl(projectId, 'monitors', [
    { field: 'status', order: 'ASCENDING' },
    { field: 'nextExpectedAt', order: 'ASCENDING' }
  ])}\n`);

  // FormVault indexes
  console.log('📋 FormVault Forms:');
  console.log('3. forms (userId + createdAt):');
  console.log(`   ${generateIndexUrl(projectId, 'forms', [
    { field: 'userId', order: 'ASCENDING' },
    { field: 'createdAt', order: 'DESCENDING' }
  ])}\n`);

  // SnipShot indexes
  console.log('📸 SnipShot API Keys:');
  console.log('4. apiKeys (userId + createdAt):');
  console.log(`   ${generateIndexUrl(projectId, 'apiKeys', [
    { field: 'userId', order: 'ASCENDING' },
    { field: 'createdAt', order: 'DESCENDING' }
  ])}\n`);

  console.log('\n💡 Note: Single-field indexes are created automatically by Firestore.');
  console.log('   You only need to create the composite indexes above.\n');
}

// Check if project ID is provided as argument
const projectId = process.argv[2];

if (projectId) {
  printIndexUrls(projectId);
  process.exit(0);
}

// Otherwise, prompt for it
console.log('🔥 Firestore Index URL Generator\n');
rl.question('Enter your Firebase Project ID: ', (answer) => {
  const trimmedProjectId = answer.trim();
  
  if (!trimmedProjectId) {
    console.error('❌ Error: Project ID is required');
    process.exit(1);
  }

  printIndexUrls(trimmedProjectId);
  rl.close();
});

