const fs = require('fs');
const path = require('path');

console.log('🔒 Fixing security vulnerabilities...');

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Remove vulnerable dependencies
const vulnerableDeps = ['express-brute', 'underscore'];
let removedDeps = [];

vulnerableDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    delete packageJson.dependencies[dep];
    removedDeps.push(dep);
    console.log(`❌ Removed vulnerable dependency: ${dep}`);
  }
});

if (removedDeps.length > 0) {
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json');
  
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm audit');
  console.log('3. Verify no critical vulnerabilities remain');
} else {
  console.log('✅ No vulnerable dependencies found in package.json');
}

console.log('\n🔍 Checking for any remaining express-brute usage...');
const { execSync } = require('child_process');

try {
  const grepResult = execSync('grep -r "express-brute" . --exclude-dir=node_modules --exclude=package-lock.json', { encoding: 'utf8' });
  console.log('⚠️  Found express-brute usage in files:');
  console.log(grepResult);
} catch (error) {
  console.log('✅ No express-brute usage found in codebase');
}

console.log('\n🎯 Security fix complete!'); 