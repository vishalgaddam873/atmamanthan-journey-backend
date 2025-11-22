require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/database");
const setupSocketHandlers = require("./socket/handlers");

// Import routes
const sessionRoutes = require("./routes/api/session");
const audioRoutes = require("./routes/api/audio");
const imageRoutes = require("./routes/api/images");
const pranRoutes = require("./routes/api/pran");
const adminRoutes = require("./routes/api/admin");
const analyticsRoutes = require("./routes/api/analytics");
const uploadRoutes = require("./routes/upload");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/assets", express.static(path.join(__dirname, "./assets")));

// API Routes
app.use("/api/session", sessionRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/pran", pranRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);

// Setup socket handlers
setupSocketHandlers(io);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
