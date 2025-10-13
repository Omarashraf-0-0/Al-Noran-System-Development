// Test API using Node.js
const https = require('https');
const http = require('http');

// Configuration
const API_BASE = 'http://localhost:3500';

// Test data
const testUser = {
  fullname: 'Test User',
  username: 'testuser' + Date.now(),
  phone: '0123456' + Math.floor(Math.random() * 10000),
  email: `test${Date.now()}@example.com`,
  password: '123456',
  type: 'client',
  clientType: 'personal',
  ssn: '12345678901234'
};

// Helper function to make HTTP requests
function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3500,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testSignup() {
  console.log('\n📝 Testing Signup...');
  console.log('User data:', testUser);
  
  try {
    const result = await makeRequest('/api/auth/signup', 'POST', testUser);
    console.log('✅ Signup Response:', JSON.stringify(result.data, null, 2));
    return result.data;
  } catch (error) {
    console.error('❌ Signup Error:', error.message);
    return null;
  }
}

async function testLogin(email, password) {
  console.log('\n🔐 Testing Login...');
  console.log('Credentials:', { email, password: '******' });
  
  try {
    const result = await makeRequest('/api/auth/login', 'POST', { email, password });
    console.log('✅ Login Response:', JSON.stringify(result.data, null, 2));
    return result.data;
  } catch (error) {
    console.error('❌ Login Error:', error.message);
    return null;
  }
}

async function testExistingUser() {
  console.log('\n🔐 Testing Login with existing user...');
  // جرب المستخدم اللي عندك في MongoDB
  const email = 'omar@test.com'; // غيرها للـ email اللي عندك
  const password = '123456';
  
  try {
    const result = await makeRequest('/api/auth/login', 'POST', { email, password });
    console.log('✅ Login Response:', JSON.stringify(result.data, null, 2));
    return result.data;
  } catch (error) {
    console.error('❌ Login Error:', error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting API Tests...');
  console.log('Base URL:', API_BASE);
  console.log('='.repeat(50));

  // Test 1: Try login with existing user first
  await testExistingUser();

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Signup new user
  const signupResult = await testSignup();
  
  if (signupResult && signupResult.success) {
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Login with new user
    await testLogin(testUser.email, testUser.password);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests completed!');
}

// Run the tests
runTests().catch(console.error);
