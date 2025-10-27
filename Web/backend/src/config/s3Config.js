const { S3Client } = require("@aws-sdk/client-s3");

// AWS S3 Configuration for Middle East (Bahrain) region
const s3Client = new S3Client({
	region: process.env.AWS_REGION || "me-south-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "noran-uploads";

module.exports = {
	s3Client,
	BUCKET_NAME,
};
