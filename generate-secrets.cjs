#!/usr/bin/env node

/**
 * Vision79 SIWM Secret Generator
 * Generates secure secrets and updates environment files
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

console.log('🔐 Vision79 SIWM Secret Generator');
console.log('==================================');
console.log('');

// Generate secure secrets
function generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('base64');
}

function generatePassword(length = 16) {
    return crypto.randomBytes(length).toString('base64');
}

// Generate secrets
const secrets = {
    JWT_SECRET: generateSecret(32),
    SESSION_SECRET: generateSecret(32),
    DB_PASSWORD: generatePassword(16),
    REDIS_PASSWORD: generatePassword(16)
};

console.log('✅ Generated secure secrets:');
console.log(`JWT_SECRET: ${secrets.JWT_SECRET.substring(0, 20)}...`);
console.log(`SESSION_SECRET: ${secrets.SESSION_SECRET.substring(0, 20)}...`);
console.log(`DB_PASSWORD: ${secrets.DB_PASSWORD.substring(0, 20)}...`);
console.log(`REDIS_PASSWORD: ${secrets.REDIS_PASSWORD.substring(0, 20)}...`);
console.log('');

// Update backend environment file
function updateBackendEnv() {
    const envPath = path.join(__dirname, 'backend', '.env.production');
    
    if (!fs.existsSync(envPath)) {
        console.log('❌ backend/.env.production not found');
        console.log('Run create-env-files.bat first to create the template');
        return false;
    }
    
    let content = fs.readFileSync(envPath, 'utf8');
    
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
    
    fs.writeFileSync(envPath, content);
    console.log('✅ Updated backend/.env.production with secure secrets');
    return true;
}

// Create secrets backup file
function createSecretsBackup() {
    const backupContent = `# Vision79 SIWM Production Secrets
# Generated on: ${new Date().toISOString()}
# ⚠️  KEEP THIS FILE SECURE AND NEVER COMMIT TO VERSION CONTROL

JWT_SECRET=${secrets.JWT_SECRET}
SESSION_SECRET=${secrets.SESSION_SECRET}
DB_PASSWORD=${secrets.DB_PASSWORD}
REDIS_PASSWORD=${secrets.REDIS_PASSWORD}

# Instructions:
# 1. Copy these values to your environment files
# 2. Store this file securely (not in version control)
# 3. Delete this file after copying values
`;
    
    fs.writeFileSync('production-secrets.txt', backupContent);
    console.log('✅ Created production-secrets.txt backup file');
}

// Update .gitignore
function updateGitignore() {
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
}

// Main execution
function main() {
    try {
        updateBackendEnv();
        createSecretsBackup();
        updateGitignore();
        
        console.log('');
        console.log('🎉 Secret generation complete!');
        console.log('==============================');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Review production-secrets.txt for your generated secrets');
        console.log('2. Update domain references in .env.production files');
        console.log('3. Configure your database and Redis connections');
        console.log('4. Set up your Gemini AI API key');
        console.log('5. Configure email service credentials');
        console.log('6. Test your configuration with: node validate-env.js');
        console.log('');
        console.log('⚠️  IMPORTANT:');
        console.log('- Keep production-secrets.txt secure');
        console.log('- Never commit secrets to version control');
        console.log('- Delete production-secrets.txt after copying values');
        console.log('');
        console.log('📖 For detailed instructions, see ENVIRONMENT_SETUP.md');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    generateSecret,
    generatePassword,
    updateBackendEnv,
    createSecretsBackup,
    updateGitignore
}; 