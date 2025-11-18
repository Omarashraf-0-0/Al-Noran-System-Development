/**
 * Delete test ACID request
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const AcidRequest = require('../src/models/acid');

async function deleteTestRequest() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('✅ Connected to MongoDB\n');

    // Delete the test request we just created
    const result = await AcidRequest.deleteOne({ 
      'supplier.name': 'شركة الاستيراد الدولية',
      'supplier.taxNum': 'TAX-123456789'
    });

    if (result.deletedCount > 0) {
      console.log('✅ Test ACID request deleted successfully!');
      console.log(`   Deleted ${result.deletedCount} document(s)`);
    } else {
      console.log('⚠️  No test request found to delete');
    }

    // Show remaining count
    const remaining = await AcidRequest.countDocuments();
    console.log(`\n📊 Remaining ACID Requests: ${remaining}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

deleteTestRequest();
