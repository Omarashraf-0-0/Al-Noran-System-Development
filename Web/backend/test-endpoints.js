const axios = require('axios');

const BASE_URL = 'http://localhost:3500';

async function testEndpoints() {
  console.log('🧪 Testing Al-Noran Backend Endpoints\n');
  
  const testEmail = 'amrabso123@gmail.com'; // يوزر موجود في الداتابيز
  const testPassword = '123456'; // افترض الباسورد
  
  // ✅ Test 1: Login (للويب)
  try {
    console.log('1️⃣ Testing Login...');
    const loginResult = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    console.log('✅ Login Success:', loginResult.data);
  } catch (error) {
    console.log('❌ Login Error:', error.response?.data || error.message);
  }
  
  console.log('\n---\n');
  
  // ✅ Test 2: Register (للموبايل)
  try {
    console.log('2️⃣ Testing Register...');
    const registerResult = await axios.post(`${BASE_URL}/api/auth/signup`, {
      fullName: 'Test User',
      username: `testuser${Date.now()}`,
      email: `test${Date.now()}@test.com`,
      phone: '01234567890',
      password: '123456',
      clientType: 'client', // client أو employee
      ssn: '12345678901234',
      agreeToTerms: true
    });
    console.log('✅ Register Success:', registerResult.data);
  } catch (error) {
    console.log('❌ Register Error:', error.response?.data || error.message);
  }
  
  console.log('\n---\n');
  
  // ✅ Test 3: Forgot Password (OTP)
  try {
    console.log('3️⃣ Testing Forgot Password (OTP)...');
    const forgotResult = await axios.post(`${BASE_URL}/api/otp/forgotPassword`, {
      email: testEmail
    });
    console.log('✅ Forgot Password Success:', forgotResult.data);
  } catch (error) {
    console.log('❌ Forgot Password Error:', error.response?.data || error.message);
  }
  
  console.log('\n---\n');
  
  // ✅ Test 4: Verify OTP
  try {
    console.log('4️⃣ Testing Verify OTP...');
    const verifyResult = await axios.post(`${BASE_URL}/api/otp/verifyOTP`, {
      email: testEmail,
      otp: '12345' // 5 digits now
    });
    console.log('✅ Verify OTP Success:', verifyResult.data);
  } catch (error) {
    console.log('❌ Verify OTP Error:', error.response?.data || error.message);
  }
  
  console.log('\n---\n');
  
  // ✅ Test 5: Reset Password
  try {
    console.log('5️⃣ Testing Reset Password...');
    const resetResult = await axios.patch(`${BASE_URL}/api/otp/resetPassword`, {
      email: testEmail,
      newPassword: '123456'
    });
    console.log('✅ Reset Password Success:', resetResult.data);
  } catch (error) {
    console.log('❌ Reset Password Error:', error.response?.data || error.message);
  }
  
  console.log('\n\n✅ All tests completed!');
}

testEndpoints();
