require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
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

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const responseHandler = require("./src/handlers/responseHandler");

// ─── POST /chat ──────────────────────────────────────────
app.post("/chat", (req, res) => responseHandler.handleChat(req, res));

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

