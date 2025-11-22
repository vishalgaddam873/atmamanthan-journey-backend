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

// Configure allowed origins
const allowedOrigins = [
  "https://atmamanthan-journey-webapp.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://d1igx7lccgvz7g.cloudfront.net",
  // Add other origins as needed
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

// Connect to database
connectDB();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now, but you can restrict this
      // Or use: callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REMOVED: Static file serving - assets now served from CloudFront CDN
// Assets are accessed directly from: https://d1igx7lccgvz7g.cloudfront.net

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

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
