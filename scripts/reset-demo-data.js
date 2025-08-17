// Reset Demo Data Script
// Run this with: node scripts/reset-demo-data.js

const axios = require('axios');

async function resetDemoData() {
  try {
    console.log('Resetting demo data...');
    
    const response = await axios.post('http://localhost:3000/api/demo/reset');
    
    if (response.status === 200) {
      console.log('Demo data reset successfully!');
      console.log(response.data);
    } else {
      console.error('Failed to reset demo data:', response.status);
    }
  } catch (error) {
    console.error('Error resetting demo data:', error.message);
    console.log('Make sure the development server is running.');
  }
}

resetDemoData();