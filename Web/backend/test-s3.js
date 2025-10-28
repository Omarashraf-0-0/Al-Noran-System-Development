const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { S3Client, ListBucketsCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

console.log('🧪 Testing S3 Connection...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('   AWS_REGION:', process.env.AWS_REGION);
console.log('   AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME);
console.log('   AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 10)}...` : 'NOT SET');
console.log('   AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET ✅' : 'NOT SET ❌');
console.log('');

// Create S3 client
const s3Client = new S3Client({
	region: process.env.AWS_REGION || "me-south-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

async function testS3() {
	try {
		const bucketName = process.env.AWS_S3_BUCKET_NAME || "noran-uploads";
		
		// Test: Upload a test file directly (skip ListBuckets which needs extra permission)
		console.log(`Test 1️⃣: Uploading test file to bucket "${bucketName}"...`);
		const testContent = 'This is a test file from Al-Noran System';
		const testKey = `test/test-${Date.now()}.txt`;
		
		const putCommand = new PutObjectCommand({
			Bucket: bucketName,
			Key: testKey,
			Body: Buffer.from(testContent),
			ContentType: 'text/plain',
		});

		await s3Client.send(putCommand);
		console.log('✅ Test file uploaded successfully!');
		console.log(`   Bucket: ${bucketName}`);
		console.log(`   Key: ${testKey}`);
		console.log(`   URL: https://${bucketName}.s3.${process.env.AWS_REGION || 'me-south-1'}.amazonaws.com/${testKey}`);
		console.log('');

		console.log('✅✅✅ S3 UPLOAD TEST PASSED! 🎉');
		console.log('');
		console.log('📝 Next Steps:');
		console.log('   1. S3 credentials are working correctly');
		console.log('   2. You can now upload files from the mobile app');
		console.log('   3. Files will be stored in S3 and metadata in MongoDB');

	} catch (error) {
		console.error('❌❌❌ S3 Test Failed!');
		console.error('Error:', error.message);
		console.error('');
		
		if (error.name === 'CredentialsProviderError' || error.message.includes('credential')) {
			console.error('🔧 Fix: Check your AWS credentials in .env file');
			console.error('   Make sure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct');
		} else if (error.name === 'NoSuchBucket') {
			console.error('🔧 Fix: The bucket does not exist');
			console.error(`   Create bucket "${process.env.AWS_S3_BUCKET_NAME}" in AWS Console`);
			console.error('   1. Go to https://s3.console.aws.amazon.com/s3/');
			console.error('   2. Click "Create bucket"');
			console.error(`   3. Name: ${process.env.AWS_S3_BUCKET_NAME}`);
			console.error('   4. Region: me-south-1 (Middle East - Bahrain)');
			console.error('   5. Keep default settings and create');
		} else if (error.name === 'AccessDenied' || error.message.includes('not authorized')) {
			console.error('🔧 Fix: Insufficient IAM permissions');
			console.error('   The IAM user needs these permissions:');
			console.error('   - s3:PutObject');
			console.error('   - s3:GetObject');
			console.error('   - s3:DeleteObject');
			console.error('');
			console.error('   To fix in AWS Console:');
			console.error('   1. Go to IAM → Users → noran-backend-user');
			console.error('   2. Permissions → Add permissions');
			console.error('   3. Attach policy: AmazonS3FullAccess');
			console.error('   OR create custom policy with bucket-specific access');
		} else {
			console.error('Full error:', error);
		}
	}
}

testS3();
