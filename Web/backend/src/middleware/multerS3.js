const multer = require("multer");
const path = require("path");

// Use memory storage - files will be stored in buffer for S3 upload
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
	console.log('📄 [Multer] File received:');
	console.log('   - Original name:', file.originalname);
	console.log('   - Mimetype:', file.mimetype);
	console.log('   - Field name:', file.fieldname);
	
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

	if (allowedMimetypes.includes(file.mimetype)) {
		console.log('✅ [Multer] File type accepted');
		cb(null, true);
	} else {
		console.log('❌ [Multer] File type REJECTED - mimetype:', file.mimetype);
		console.log('   Allowed types:', allowedMimetypes);
		cb(
			new Error(
				"Invalid file type. Only PDF, Images, Word, and Excel files are allowed"
			),
			false
		);
	}
};

// Multer configuration
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB max file size
	},
});

module.exports = upload;
