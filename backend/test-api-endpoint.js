const axios = require('axios');

const testApiEndpoint = async () => {
  try {
    console.log('Testing API endpoint: /api/v1/dashboard/items-below-reorder-point');
    
    // Test the API endpoint directly
    const response = await axios.get('http://localhost:3001/api/v1/dashboard/items-below-reorder-point', {
      headers: {
        'Authorization': 'Bearer test-token' // You might need to adjust this
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response Data:', JSON.stringify(response.data, null, 2));
    console.log(`✅ Found ${response.data.length} items below reorder point`);
    
    if (response.data.length > 0) {
      console.log('Sample item from API:');
      console.log(JSON.stringify(response.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
};

testApiEndpoint(); 