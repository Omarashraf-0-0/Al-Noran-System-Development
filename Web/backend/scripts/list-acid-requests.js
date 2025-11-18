/**
 * List all ACID requests in the database
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const AcidRequest = require('../src/models/acid');
const User = require('../src/models/user');

async function listAcidRequests() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected to MongoDB\n');

    const requests = await AcidRequest.find().populate('userId').sort({ requestDate: -1 });

    console.log(`📊 Total ACID Requests: ${requests.length}\n`);

    if (requests.length === 0) {
      console.log('⚠️  No ACID requests found in database');
    } else {
      console.log('ACID Requests List:');
      console.log('='.repeat(100));

      requests.forEach((req, index) => {
        console.log(`\n${index + 1}. Request ID: ${req._id}`);
        console.log(`   User: ${req.userId?.fullname || 'N/A'} (${req.userId?.email || 'N/A'})`);
        console.log(`   Supplier: ${req.supplier.name}`);
        console.log(`   Tax Number: ${req.supplier.taxNum}`);
        console.log(`   Country: ${req.supplier.country}`);
        console.log(`   Email: ${req.supplier.email}`);
        console.log(`   Phone: ${req.supplier.mobileNum}`);
        console.log(`   Goods: ${req.goods.description}`);
        console.log(`   Weight: ${req.goods.weight} kg`);
        console.log(`   Customs Item: ${req.goods.customsItem}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   ACID Code: ${req.acidCode || 'Not assigned yet'}`);
        console.log(`   Request Date: ${req.requestDate}`);
        console.log(`   Uploads: ${req.uploads?.length || 0} file(s)`);
      });

      console.log('\n' + '='.repeat(100));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

listAcidRequests();
