const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../../logger");
const learnerStateManager = require("../state/learnerStateManager");
const evaluationEngine = require("../engine/evaluationEngine");
const promptBuilder = require("../engine/promptBuilder");

class ResponseHandler {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async handleChat(req, res) {
    const startTime = Date.now();
    const requestId = req.requestId;
    
    try {
      const { message, history } = req.body;
      const sessionId = req.headers['x-session-id'] || 'default-session';

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "message is required and must be a string" });
      }

      logger.info(`Processing chat request`, { requestId, sessionId, messageLength: message.length });

      const cleanMsg = message.trim().toLowerCase();

      // 1. Run Evaluation to update state based on user's answer
      await evaluationEngine.evaluate(sessionId, message, history);
      
      const state = learnerStateManager.getState(sessionId);

      // 2. Intercept Commands
      if (cleanMsg === "test me") {
          learnerStateManager.updateState(sessionId, { is_testing: true });
      }

      // 3. Onboarding Flow Logic (Strict Enforcement)
      if (!state.topic && !state.is_testing) {
          // If topic is still missing (evaluation engine didn't set it because it was just "hi")
          // Or if this is the very first message.
          if (cleanMsg.replace(/[.,!?]+$/, "") === "hi" || cleanMsg === "hello") {
              return this._sendResponse(res, "Hello! I am your AI Learning Companion.\n\nWhat do you want to learn today?", 0, 0, startTime);
          }
          if (!state.topic) { // Ensure evaluation engine didn't just set it
             return this._sendResponse(res, "What do you want to learn today?", 0, 0, startTime);
          }
      }

      if (state.topic && !state.depth_preference_known && !state.is_testing) {
          return this._sendResponse(res, `Awesome, let's dive into **${state.topic}**!\n\nDo you want a simple explanation or a deeper one?`, 0, 0, startTime);
      }

      // 4. Build Gemini Context
      const contents = [];
      if (Array.isArray(history)) {
        for (const entry of history) {
          contents.push({
            role: entry.role === "user" ? "user" : "model",
            parts: [{ text: entry.content }],
          });
        }
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      // 5. Generate Response using dynamic prompt
      const dynamicInstruction = promptBuilder.buildSystemInstruction(sessionId);
      
      const chatModel = this.genAI.getGenerativeModel({
        model: "gemini-3-flash-preview", // Using the model configured in server.js
        systemInstruction: dynamicInstruction,
      });

      const result = await chatModel.generateContent({ contents });
      const response = result.response;
      let aiText = response.text().trim();
      const usage = response.usageMetadata || {};

      // 6. Teaching Loop Enforcement (Ensure a question is asked)
      const stateAfter = learnerStateManager.getState(sessionId);
      if (!stateAfter.is_testing) {
          // Check if the response ends with a question mark (simple heuristic)
          const lastSentence = aiText.slice(-80);
          if (!lastSentence.includes('?')) {
              aiText += "\n\nDoes that make sense so far, or do you have any questions?";
          }
      } else {
          // Turn off testing mode after generating the test
          learnerStateManager.updateState(sessionId, { is_testing: false });
      }

      // Fallback JSON stripping (safety measure)
      aiText = aiText.replace(/```json\s*\{[\s\S]*?\}\s*```/gi, '');

      return this._sendResponse(res, aiText, usage.promptTokenCount || 0, usage.candidatesTokenCount || 0, startTime);

    } catch (err) {
      logger.error("Error in responseHandler", { 
        requestId: req.requestId, 
        message: err.message, 
        stack: err.stack 
      });
      return res.status(500).json({ error: "Failed to generate response", details: err.message });
    }
  }

  _sendResponse(res, reply, inputTokens, outputTokens, startTime) {
      const duration = Date.now() - startTime;
      return res.json({ 
        reply: reply,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens
        }
      });
  }
}

module.exports = new ResponseHandler();
