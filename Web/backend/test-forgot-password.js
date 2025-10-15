const axios = require('axios');

const BASE_URL = 'http://localhost:3500';
const TEST_EMAIL = 'amrabso123@gmail.com'; // يوزر موجود

async function testForgotPasswordFlow() {
  console.log('🔐 Testing Complete Forgot Password Flow\n');
  console.log('📧 Using email:', TEST_EMAIL);
  console.log('='  .repeat(60));
  
  try {
    // Step 1: Send OTP
    console.log('\n📤 Step 1: Sending OTP...');
    const forgotResult = await axios.post(`${BASE_URL}/api/otp/forgotPassword`, {
      email: TEST_EMAIL
    });
    console.log('✅ OTP Sent Successfully!');
    console.log('Response:', forgotResult.data);
    console.log('\n⏰ Check your email for the 5-digit OTP code');
    console.log('📌 You have 5 minutes to enter the OTP');
    console.log('📌 You can resend the OTP up to 3 times');
    console.log('📌 You have 5 attempts to enter the correct OTP');
    
    // Wait for user to check email
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Now you need to:');
    console.log('1. Check the email for the 5-digit OTP');
    console.log('2. Enter it in the mobile app OTP page');
    console.log('3. The OTP will expire in 5 minutes');
    console.log('\n💡 To test verify OTP, run: node test-verify-otp.js <OTP_CODE>');
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testForgotPasswordFlow();
