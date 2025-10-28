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

// --- 1. استيراد المكتبات الجديدة ---
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);

connectDB();

// --- 2. إنشاء سيرفر HTTP وربطه بـ Express و Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // تأكد أن هذا هو رابط الفرونت إند
        methods: ["GET", "POST"],
        credentials: true,
    },
});

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

// --- 3. إضافة middleware لجعل io متاحاً في كل routes ---
// هذا سيمكنك من الوصول إليه داخل الـ controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

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
app.use("/api/upload/users", require("./routes/uploadRoutes"));
app.use("/api/upload/shipments", require("./routes/uploadRoutes"));
app.use("/api/uploads", require("./routes/uploadS3Routes")); // S3 Upload Routes
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

// --- 4. منطق الـ Socket.IO ---
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on("joinShipmentRoom", (acid) => {
        socket.join(acid); 
        console.log(`Socket ${socket.id} joined room for ACID: ${acid}`);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
mongoose.connection.on("error", (err) => {
    console.log(err);
    logEvents(
        `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
        "mongoErrLog.log"
    );
});
