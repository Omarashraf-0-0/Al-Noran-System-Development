const jwt = require("jsonwebtoken");

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
			// Get token from header (format: "Bearer <token>")
			token = req.headers.authorization.split(" ")[1];

			// Verify token
			const decoded = jwt.verify(token, process.env.JWT_SECRET);

			// Attach user info to request object
			req.user = {
				id: decoded.id || decoded._id,
				_id: decoded.id || decoded._id,
				email: decoded.email,
				userType: decoded.userType,
				clientType: decoded.clientType,
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
