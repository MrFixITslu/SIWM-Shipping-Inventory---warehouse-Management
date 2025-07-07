const fs = require('fs');
try {
  console.log(fs.readFileSync('C:/Vision79/Inventoryapp/cert/server.key', 'utf8'));
  console.log('File read successfully');
} catch (err) {
  console.error('Error reading file:', err);
}