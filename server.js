require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { initializeCounter } = require("./utils/counter");
const cloudinary = require("cloudinary").v2;
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");

const app = express();

app.set("trust proxy", 1);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : []),
  ...(process.env.NODE_ENV === "development"
    ? [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
      ]
    : []),
].filter(Boolean);

// Normalize origin comparison
const normalizeOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.hostname}${
      url.port ? `:${url.port}` : ""
    }`.toLowerCase();
  } catch {
    return origin.toLowerCase();
  }
};

app.use((req, res, next) => {
  console.log("🔍 Request Origin:", req.headers.origin);
  console.log("🔍 Host Header:", req.headers.host);
  next();
});

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);
    const isAllowed = allowedOrigins.some(
      (allowed) => normalizeOrigin(allowed) === normalizedOrigin
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.error("CORS rejected origin:", origin);
      console.log("Allowed origins:", allowedOrigins);
      callback(
        new Error(`Not allowed by CORS. Allowed: ${allowedOrigins.join(", ")}`)
      );
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));

// Rate Limiting
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again later" },
});

// Routes
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api", orderLimiter, require("./routes/orderRoutes"));
app.use("/admin", require("./routes/authRoutes"));
app.use("/api/admin", adminLimiter, require("./routes/adminRoutes"));
app.use("/api/account", require("./routes/accountRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// Swagger Documentation
// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
    customJs: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js",
    ],
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle CORS errors specifically
  if (err.message.includes("CORS")) {
    return res.status(403).json({
      error: "CORS Error",
      message: "Request not allowed from this origin",
    });
  }

  res.status(500).json({
    error: "Server error",
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Connect to MongoDB and Start Server
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  })
  .then(async () => {
    console.log("🚀 Connected to MongoDB");
    await initializeCounter("orderNumber");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

module.exports = app;
