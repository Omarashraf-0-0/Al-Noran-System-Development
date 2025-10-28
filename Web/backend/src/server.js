const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const app = express();
const errorHandler = require("./middleware/errorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const { logger, logEvents } = require("./middleware/logger");
const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);

connectDB();
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
		optionsSuccessStatus: 200,
	})
);
app.use(logger);

// app.use(cors(corsOptions))

app.use(express.json());

app.use(cookieParser());

app.use(
	"/",
	express.static(path.join(__dirname, "..", "..", "frontend", "public"))
);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/", require("./routes/root"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/users", require("./routes/loginRoutes"));
app.use("/api/otp", require("./routes/otpRoutes"));
app.use("/api/shipments", require("./routes/shipmentRoutes"));
app.use("/api/acid", require("./routes/acidRoutes"));
app.use("/api/invoice", require("./routes/invoiceRoutes"));
app.use("/api/finance", require("./routes/financeRoutes"));
app.use("/api/upload/users", require("./routes/uploadRoutes")); // Legacy local uploads
app.use("/api/upload/shipments", require("./routes/uploadRoutes")); // Legacy local uploads
app.use("/api/uploads", require("./routes/uploadS3Routes")); // NEW: S3-based uploads
app.use((req, res) => {
	res.status(404);
	if (req.accepts("html")) {
		// res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'views',  '404.html'))
		res.json({ message: "404 Not Found" });
	} else if (req.accepts("json")) {
		res.json({ message: "404 Not Found" });
	} else {
		res.type("txt").send("404 Not Found");
	}
});

app.use(errorHandler);
mongoose.connection.once("open", () => {
	console.log("Connected to MongoDB");
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
mongoose.connection.on("error", (err) => {
	console.log(err);
	logEvents(
		`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
		"mongoErrLog.log"
	);
});
