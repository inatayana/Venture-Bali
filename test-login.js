const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3001/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@baliwild.com', password: 'BaliWild2026!' })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.headers.get('set-cookie')) {
      console.log('Cookie set:', response.headers.get('set-cookie'));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();