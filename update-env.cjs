#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the generated secrets
const secretsContent = fs.readFileSync('production-secrets.txt', 'utf8');
const secrets = {};

// Parse secrets from the file
secretsContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    secrets[key.trim()] = value.trim();
  }
});

console.log('🔧 Updating environment files with generated secrets...');

// Update backend environment file
const backendEnvPath = path.join(__dirname, 'backend', '.env.production');
if (fs.existsSync(backendEnvPath)) {
  let content = fs.readFileSync(backendEnvPath, 'utf8');
  
  // Replace placeholder secrets with generated ones
  content = content.replace(
    /JWT_SECRET=.*/,
    `JWT_SECRET=${secrets.JWT_SECRET}`
  );
  
  content = content.replace(
    /SESSION_SECRET=.*/,
    `SESSION_SECRET=${secrets.SESSION_SECRET}`
  );
  
  content = content.replace(
    /DB_PASSWORD=.*/,
    `DB_PASSWORD=${secrets.DB_PASSWORD}`
  );
  
  content = content.replace(
    /REDIS_PASSWORD=.*/,
    `REDIS_PASSWORD=${secrets.REDIS_PASSWORD}`
  );
  
  fs.writeFileSync(backendEnvPath, content);
  console.log('✅ Updated backend/.env.production');
} else {
  console.log('❌ backend/.env.production not found');
}

// Update .gitignore
const gitignorePath = path.join(__dirname, '.gitignore');
let gitignoreContent = '';

if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

const entriesToAdd = [
  '',
  '# Production environment files',
  '.env.production',
  'backend/.env.production',
  'production-secrets.txt'
];

let updated = false;
for (const entry of entriesToAdd) {
  if (!gitignoreContent.includes(entry)) {
    gitignoreContent += entry + '\n';
    updated = true;
  }
}

if (updated) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('✅ Updated .gitignore');
}

console.log('');
console.log('🎉 Environment configuration complete!');
console.log('=====================================');
console.log('');
console.log('📋 Next steps:');
console.log('1. Update domain references in .env.production files');
console.log('2. Configure your database and Redis connections');
console.log('3. Set up your Gemini AI API key');
console.log('4. Configure email service credentials');
console.log('5. Test your configuration with: node validate-env.js');
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('- Keep production-secrets.txt secure');
console.log('- Never commit secrets to version control');
console.log('- Delete production-secrets.txt after copying values');
console.log('');
console.log('📖 For detailed instructions, see ENVIRONMENT_SETUP.md'); 