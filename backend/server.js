require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("./logger");
const { SYSTEM_PROMPT } = require("./prompts");

// ─── Config ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  logger.error("GEMINI_API_KEY is not set in .env");
  process.exit(1);
}

// ─── Gemini client ───────────────────────────────────────
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// ─── Express app ─────────────────────────────────────────
const app = express();

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});

// HTTP Logging with Morgan
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(cors());
app.use(express.json());

// Strict Rate Limiting: Max 30 requests per hour per IP to protect billing
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 requests per windowMs
  message: { error: "You have reached the maximum number of requests (30 per hour). Please try again later." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const responseHandler = require("./src/handlers/responseHandler");

// ─── POST /chat ──────────────────────────────────────────
// Apply the rate limiter specifically to the chat endpoint where API costs occur
app.post("/chat", chatLimiter, (req, res) => responseHandler.handleChat(req, res));

// ─── Serve Frontend ─────────────────────────────────────
// Serve static files from the frontend/dist directory
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Handle any requests that don't match the ones above (SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// ─── Start server ────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Backend running on http://localhost:${PORT}`);
    logger.info(`API key loaded: ${GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 8) + "..." : "missing"}`);
  });
}

module.exports = app;

