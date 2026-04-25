require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ─── Config ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌  GEMINI_API_KEY is not set in .env");
  process.exit(1);
}

// ─── Gemini client ───────────────────────────────────────
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ─── System prompt ───────────────────────────────────────
const SYSTEM_PROMPT = `You are an AI learning companion.

Maintain an internal USER MODEL in JSON:
{
  "level": 1,
  "understanding": 50,
  "topic": "",
  "mistakes": []
}

RULES:

1. Teaching Style Based on Level:
- Level 1: very simple, analogies
- Level 2: simple explanations
- Level 3: structured explanations
- Level 4: technical depth
- Level 5: advanced concepts and edge cases

2. First Interaction:
If no topic is set:
Ask: "What do you want to learn today?"
Then ask:
"Do you want a simple explanation or a more detailed one?"

If user does not specify level:
Default to simple explanation (Level 1–2)

3. Interaction Loop:
- Explain concept based on current level
- Then ask exactly 1 short question to test understanding

4. Evaluation:
When user answers:
- Evaluate correctness
- If correct → slightly increase level
- If wrong → decrease level or simplify
- Identify mistakes and track them internally

5. Adaptation Rules:
- If user shows confusion → simplify + use analogy
- If user answers correctly twice → increase difficulty
- If user struggles → break concept into smaller parts

6. Personalization:
- Do NOT ask too many questions upfront
- Infer user level from responses instead of asking directly

7. Response Style:
- Keep responses short, clear, and interactive
- Avoid long paragraphs
- Use conversational tone
- Use markdown formatting for better readability (bold, bullet points, code blocks when relevant)

8. Boundaries:
- Stay focused on teaching
- Do not drift into general chatting
- Do not expose USER MODEL unless explicitly asked

9. Goal:
Continuously adapt teaching style to match user understanding and help them learn effectively.`;

// ─── Express app ─────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── POST /chat ──────────────────────────────────────────
app.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required and must be a string" });
    }

    console.log(`\n📩  User: ${message}`);

    // Build conversation contents for Gemini
    // The system instruction is passed separately via the model config
    const contents = [];

    // Add conversation history
    if (Array.isArray(history)) {
      for (const entry of history) {
        contents.push({
          role: entry.role === "user" ? "user" : "model",
          parts: [{ text: entry.content }],
        });
      }
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    console.log(`📜  Conversation length: ${contents.length} messages`);

    // Call Gemini with system instruction
    const chatModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await chatModel.generateContent({ contents });
    const response = result.response;
    const aiText = response.text();

    console.log(`🤖  AI: ${aiText.substring(0, 100)}...`);

    return res.json({ reply: aiText });
  } catch (err) {
    console.error("❌  Error in /chat:", err.message);
    return res.status(500).json({
      error: "Failed to generate response",
      details: err.message,
    });
  }
});

// ─── Start server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Backend running on http://localhost:${PORT}`);
  console.log(`🔑  API key loaded: ${GEMINI_API_KEY.substring(0, 8)}...`);
});
