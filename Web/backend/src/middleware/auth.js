const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * Middleware to protect routes - verifies JWT token
 * Extracts user info from token and attaches to req.user
 */
const protect = async (req, res, next) => {
	let token;

	// Check if authorization header exists and starts with Bearer
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		try {
			// Get token from header (format: 'Bearer <token>')
			token = req.headers.authorization.split(" ")[1];

			// Verify token
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			// Fetch user from database to check current status
			const user = await User.findById(decoded.id || decoded._id).select(
				"active type employeeDetails"
			);

			// Check if user exists
			if (!user) {
				return res.status(401).json({ message: "المستخدم غير موجود" });
			}

			// Check if user is active
			if (!user.active) {
				return res
					.status(403)
					.json({ message: "تم إيقاف حسابك. تواصل مع الإدارة" });
			}

			// Check if employee is suspended
			if (user.type === "employee" && user.employeeDetails?.suspended) {
				return res.status(403).json({
					message: user.employeeDetails.suspensionReason
						? `تم إيقافك عن العمل. السبب: ${user.employeeDetails.suspensionReason}`
						: "تم إيقافك عن العمل. تواصل مع الإدارة",
				});
			}

			// Attach user info to request object
			req.user = {
				id: decoded.id || decoded._id,
				_id: decoded.id || decoded._id,
				email: decoded.email,
				userType: decoded.userType || decoded.type || user.type,
				type: decoded.type || decoded.userType || user.type,
				clientType: decoded.clientType || user.clientDetails?.clientType,
			};

			next();
		} catch (error) {
			console.error("Token verification failed:", error.message);
			return res.status(401).json({ message: "Not authorized, token failed" });
		}
	}

	if (!token) {
		return res.status(401).json({ message: "Not authorized, no token" });
	}
};

module.exports = { protect };
