/**
 * Test script to create an ACID request
 * This simulates what the mobile app does
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../src/models/user');
const AcidRequest = require('../src/models/acid');

async function testAcidRequest() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find test user (xiiMody)
    const testUser = await User.findOne({ username: 'xiiMody' });
    if (!testUser) {
      console.log('❌ Test user (xiiMody) not found!');
      process.exit(1);
    }

    console.log(`👤 Test User Found:`);
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Full Name: ${testUser.fullname}\n`);

    // Create test ACID request
    const testRequest = {
      userId: testUser._id,
      supplier: {
        name: 'شركة الاستيراد الدولية',
        taxNum: 'TAX-123456789',
        country: 'الصين',
        email: 'supplier@import.com',
        mobileNum: '+86-123-456-7890'
      },
      goods: {
        description: 'أجهزة إلكترونية ومعدات كمبيوتر',
        weight: '500',
        customsItem: 'الكترونيات'
      },
      shipmentType: 'بحري',
      status: 'Pending'
    };

    console.log('📝 Creating test ACID request...');
    const acidRequest = new AcidRequest(testRequest);
    await acidRequest.save();

    console.log('\n✅ ACID Request Created Successfully!');
    console.log(`   Request ID: ${acidRequest._id}`);
    console.log(`   User: ${testUser.fullname} (${testUser.email})`);
    console.log(`   Supplier: ${acidRequest.supplier.name}`);
    console.log(`   Tax Number: ${acidRequest.supplier.taxNum}`);
    console.log(`   Country: ${acidRequest.supplier.country}`);
    console.log(`   Email: ${acidRequest.supplier.email}`);
    console.log(`   Phone: ${acidRequest.supplier.mobileNum}`);
    console.log(`   Goods: ${acidRequest.goods.description}`);
    console.log(`   Weight: ${acidRequest.goods.weight} kg`);
    console.log(`   Customs Item: ${acidRequest.goods.customsItem}`);
    console.log(`   Shipment Type: ${acidRequest.shipmentType}`);
    console.log(`   Status: ${acidRequest.status}`);
    console.log(`   Request Date: ${acidRequest.requestDate}`);

    // Verify it was saved
    console.log('\n🔍 Verifying in database...');
    const savedRequest = await AcidRequest.findById(acidRequest._id).populate('userId');
    
    if (savedRequest) {
      console.log('✅ Request found in database!');
      console.log(`   User Full Name: ${savedRequest.userId.fullname}`);
      console.log(`   User Email: ${savedRequest.userId.email}`);
    } else {
      console.log('❌ Request not found in database!');
    }

    // Count total ACID requests
    const totalRequests = await AcidRequest.countDocuments();
    console.log(`\n📊 Total ACID Requests in Database: ${totalRequests}`);

    // List all ACID requests for this user
    const userRequests = await AcidRequest.find({ userId: testUser._id });
    console.log(`📋 ACID Requests for ${testUser.username}: ${userRequests.length}`);
    
    if (userRequests.length > 0) {
      console.log('\nUser\'s ACID Requests:');
      userRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. Supplier: ${req.supplier.name}, Status: ${req.status}, Date: ${req.requestDate}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

testAcidRequest();
