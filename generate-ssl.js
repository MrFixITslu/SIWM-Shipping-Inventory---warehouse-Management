import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create cert directory if it doesn't exist
const certDir = path.join(__dirname, 'cert');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

console.log('🔐 Generating SSL certificates for development...');

try {
  // Generate private key with stronger encryption
  console.log('📝 Generating private key...');
  execSync(`openssl genrsa -out "${path.join(certDir, 'server.key')}" 4096`, { stdio: 'inherit' });
  
  // Create a config file for the certificate
  const configContent = `[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = Development
L = Development
O = Vision79
OU = Development
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
DNS.3 = 192.168.100.168
IP.1 = 127.0.0.1
IP.2 = 192.168.100.168
`;

  const configPath = path.join(certDir, 'openssl.conf');
  fs.writeFileSync(configPath, configContent);
  
  // Generate certificate signing request with modern settings
  console.log('📋 Generating certificate signing request...');
  execSync(`openssl req -new -key "${path.join(certDir, 'server.key')}" -out "${path.join(certDir, 'server.csr')}" -config "${configPath}"`, { stdio: 'inherit' });
  
  // Generate self-signed certificate with modern settings
  console.log('✅ Generating self-signed certificate...');
  execSync(`openssl x509 -req -days 365 -in "${path.join(certDir, 'server.csr')}" -signkey "${path.join(certDir, 'server.key')}" -out "${path.join(certDir, 'server.crt')}" -extensions v3_req -extfile "${configPath}"`, { stdio: 'inherit' });
  
  // Clean up temporary files
  fs.unlinkSync(path.join(certDir, 'server.csr'));
  fs.unlinkSync(configPath);
  
  console.log('🎉 SSL certificates generated successfully!');
  console.log('📁 Certificate files created in:', certDir);
  console.log('   - server.key (private key)');
  console.log('   - server.crt (certificate)');
  console.log('');
  console.log('⚠️  Note: These are self-signed certificates for development only.');
  console.log('   Your browser will show a security warning - this is normal.');
  console.log('   Click "Advanced" and "Proceed to localhost" to continue.');
  
} catch (error) {
  console.error('❌ Error generating SSL certificates:', error.message);
  console.log('');
  console.log('💡 Alternative: If you don\'t have OpenSSL installed, you can:');
  console.log('   1. Install OpenSSL from https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   2. Or use HTTP instead of HTTPS for development');
  console.log('   3. Or run: npm run dev:http (if available)');
} 