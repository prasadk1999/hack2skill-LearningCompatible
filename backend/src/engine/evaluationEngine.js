const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../../logger");
const learnerStateManager = require("../state/learnerStateManager");
const { EVALUATION_PROMPT } = require("../../prompts");

class EvaluationEngine {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.5-flash for fast, cheap evaluations
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: EVALUATION_PROMPT
    });
  }

  async evaluate(sessionId, userMessage, history) {
    const state = learnerStateManager.getState(sessionId);

    // If no history, it's the first message. Try to capture topic if it's not a basic greeting.
    if (!history || history.length === 0) {
      const msg = userMessage.toLowerCase().replace(/[.,!?]+$/, "");
      if (msg !== "hi" && msg !== "hello" && msg !== "hey" && msg !== "greetings") {
        learnerStateManager.updateState(sessionId, { topic: userMessage });
        return { type: 'topic_set' };
      }
      return null;
    }

    // Find the last assistant message to know what question was asked
    const lastAssistantMessage = [...history].reverse().find(m => m.role === 'model' || m.role === 'assistant');
    if (!lastAssistantMessage) return null;

    // Skip heavy evaluation if we are still onboarding
    if (!state.topic) {
      // Simple heuristic: just set the topic to whatever they said
      learnerStateManager.updateState(sessionId, { topic: userMessage });
      return { type: 'topic_set' };
    }

    if (!state.depth_preference_known) {
      // Heuristic for depth preference
      const msg = userMessage.toLowerCase();
      let level = 2;
      if (msg.includes("deep") || msg.includes("detail") || msg.includes("advanced") || msg.includes("complex")) level = 4;
      if (msg.includes("simple") || msg.includes("basic") || msg.includes("easy") || msg.includes("analogy")) level = 1;

      learnerStateManager.updateState(sessionId, { depth_preference_known: true, level });
      return { type: 'depth_set' };
    }

    // Standard evaluation loop
    try {
      const prompt = `
Tutor asked: "${lastAssistantMessage.content || lastAssistantMessage.parts?.[0]?.text}"
Student answered: "${userMessage}"
      `;

      // We explicitly request JSON format
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const text = result.response.text();
      const evalData = JSON.parse(text);

      logger.debug("Evaluation result", { sessionId, evalData });

      // Apply state updates based on evaluation
      let newLevel = state.level;
      let newScore = state.understanding_score;

      if (evalData.isCorrect) {
        newLevel = Math.min(5, newLevel + 0.5); // Increment slowly
        newScore = Math.min(1, newScore + 0.1);
        learnerStateManager.updateState(sessionId, {
          last_answer_correct: true,
          level: newLevel,
          understanding_score: newScore
        });
      } else {
        newLevel = Math.max(1, newLevel - 0.5);
        newScore = Math.max(0, newScore - 0.1);
        learnerStateManager.updateState(sessionId, {
          last_answer_correct: false,
          level: newLevel,
          understanding_score: newScore
        });

        if (evalData.misconception) {
          learnerStateManager.addMisconception(sessionId, evalData.misconception);
        }
      }

      return evalData;

    } catch (err) {
      logger.error("Evaluation failed", { error: err.message, stack: err.stack });
      // Fail gracefully: don't crash, just don't update state
      return null;
    }
  }
}

module.exports = new EvaluationEngine();
