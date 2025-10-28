const {
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, BUCKET_NAME } = require("../config/s3Config");
const path = require("path");

/**
 * Generate S3 key (folder path) based on user type, category, and related IDs
 * @param {Object} params - Parameters for key generation
 * @param {String} params.userId - User ID
 * @param {String} params.userType - User type (client, employee, admin)
 * @param {String} params.category - Upload category (registration, acid, shipment, invoice, archive)
 * @param {String} params.relatedId - Related ID (shipmentId, acidId, invoiceId)
 * @param {String} params.filename - Original filename
 * @param {String} params.clientType - Client type (factory, commercial, personal) - optional
 * @returns {String} S3 key path
 */
const generateS3Key = ({
	userId,
	userType,
	category,
	relatedId,
	filename,
	clientType = null,
}) => {
	// Sanitize filename - remove spaces and special characters
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
	const timestamp = Date.now();
	const uniqueFilename = `${timestamp}_${sanitizedFilename}`;

	let basePath = "";

	switch (userType) {
		case "client":
			basePath = `clients/${userId}`;
			break;
		case "employee":
			basePath = `employees/${userId}`;
			break;
		case "admin":
			basePath = `admin`;
			break;
		default:
			throw new Error(`Invalid userType: ${userType}`);
	}

	let fullPath = "";

	switch (category) {
		case "registration":
			fullPath = `${basePath}/registration/${uniqueFilename}`;
			break;
		case "acidrequest":
			// ACID requests don't need relatedId initially (created during request)
			fullPath = `${basePath}/acidrequest/${uniqueFilename}`;
			break;
		case "acid":
			if (!relatedId) throw new Error("relatedId required for acid category");
			fullPath = `${basePath}/acid/${relatedId}/${uniqueFilename}`;
			break;
		case "shipment":
			if (!relatedId)
				throw new Error("relatedId required for shipment category");
			fullPath = `${basePath}/shipments/${relatedId}/${uniqueFilename}`;
			break;
		case "invoice":
			if (!relatedId)
				throw new Error("relatedId required for invoice category");
			fullPath = `${basePath}/invoices/${relatedId}/${uniqueFilename}`;
			break;
		case "archive":
			fullPath = `${basePath}/archive/${uniqueFilename}`;
			break;
		default:
			throw new Error(`Invalid category: ${category}`);
	}

	return fullPath;
};

/**
 * Upload file to S3
 * @param {Object} params - Upload parameters
 * @param {Buffer} params.fileBuffer - File buffer
 * @param {String} params.s3Key - S3 key (path)
 * @param {String} params.mimetype - File mimetype
 * @returns {Promise<Object>} Upload result with URL
 */
const uploadToS3 = async ({ fileBuffer, s3Key, mimetype }) => {
	try {
		const command = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
			Body: fileBuffer,
			ContentType: mimetype,
			ACL: "private", // Private files - use presigned URLs for access
		});

		await s3Client.send(command);

		// Generate public URL (won't work for private ACL, use presigned URL instead)
		const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "me-south-1"}.amazonaws.com/${s3Key}`;

		return {
			success: true,
			s3Key,
			url,
		};
	} catch (error) {
		console.error("S3 Upload Error:", error);
		throw new Error(`Failed to upload to S3: ${error.message}`);
	}
};

/**
 * Generate presigned URL for private file access
 * @param {String} s3Key - S3 key (path)
 * @param {Number} expiresIn - URL expiration in seconds (default 1 hour)
 * @returns {Promise<String>} Presigned URL
 */
const getPresignedUrl = async (s3Key, expiresIn = 3600) => {
	try {
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		const presignedUrl = await getSignedUrl(s3Client, command, {
			expiresIn,
		});
		return presignedUrl;
	} catch (error) {
		console.error("Presigned URL Error:", error);
		throw new Error(`Failed to generate presigned URL: ${error.message}`);
	}
};

/**
 * Delete file from S3
 * @param {String} s3Key - S3 key (path)
 * @returns {Promise<Boolean>} Success status
 */
const deleteFromS3 = async (s3Key) => {
	try {
		const command = new DeleteObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		await s3Client.send(command);
		return true;
	} catch (error) {
		console.error("S3 Delete Error:", error);
		throw new Error(`Failed to delete from S3: ${error.message}`);
	}
};

/**
 * Check if file exists in S3
 * @param {String} s3Key - S3 key (path)
 * @returns {Promise<Boolean>} Exists status
 */
const fileExistsInS3 = async (s3Key) => {
	try {
		const command = new HeadObjectCommand({
			Bucket: BUCKET_NAME,
			Key: s3Key,
		});

		await s3Client.send(command);
		return true;
	} catch (error) {
		if (error.name === "NotFound") {
			return false;
		}
		throw error;
	}
};

/**
 * Validate file type and size
 * @param {Object} file - File object from multer
 * @param {Number} maxSize - Max file size in bytes (default 10MB)
 * @returns {Object} Validation result
 */
const validateFile = (file, maxSize = 10 * 1024 * 1024) => {
	const allowedMimetypes = [
		"application/pdf",
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	];

	if (!allowedMimetypes.includes(file.mimetype)) {
		return {
			valid: false,
			error: `File type not allowed. Allowed types: PDF, Images (JPG, PNG, GIF, WEBP), Word, Excel`,
		};
	}

	if (file.size > maxSize) {
		return {
			valid: false,
			error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
		};
	}

	return { valid: true };
};

module.exports = {
	generateS3Key,
	uploadToS3,
	getPresignedUrl,
	deleteFromS3,
	fileExistsInS3,
	validateFile,
};
