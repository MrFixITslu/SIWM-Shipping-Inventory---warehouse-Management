const os = require('os');

function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  console.log('🌐 Network Information for Multi-Device Access');
  console.log('==============================================\n');

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          address: iface.address,
          netmask: iface.netmask,
          cidr: iface.cidr
        });
      }
    }
  }

  if (addresses.length === 0) {
    console.log('❌ No external network interfaces found.');
    console.log('Make sure your computer is connected to a network.');
    return;
  }

  console.log('📡 Available Network Interfaces:');
  addresses.forEach((addr, index) => {
    console.log(`\n${index + 1}. Interface: ${addr.name}`);
    console.log(`   IP Address: ${addr.address}`);
    console.log(`   Network: ${addr.cidr}`);
  });

  console.log('\n🚀 Access URLs for Other Devices:');
  console.log('==================================');
  
  addresses.forEach((addr, index) => {
    console.log(`\n📱 From Device ${index + 1}:`);
    console.log(`   Frontend: http://${addr.address}:5176`);
    console.log(`   Backend API: http://${addr.address}:4000/api/v1`);
    console.log(`   HTTPS Frontend: https://${addr.address}:5176`);
    console.log(`   HTTPS Backend: https://${addr.address}:4000/api/v1`);
  });

  console.log('\n🔧 Configuration Notes:');
  console.log('=======================');
  console.log('• Make sure your firewall allows connections on ports 4000 and 5176');
  console.log('• For production, consider using a reverse proxy like nginx');
  console.log('• Update your .env file with the correct API URL if needed');
  console.log('• The app will automatically detect network access');
  
  console.log('\n⚠️  Security Considerations:');
  console.log('===========================');
  console.log('• This configuration allows access from any device on your network');
  console.log('• For production deployment, use proper security measures');
  console.log('• Consider using HTTPS certificates for secure access');
  console.log('• Implement proper authentication and authorization');
}

getNetworkInfo(); 