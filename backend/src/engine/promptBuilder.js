const { SYSTEM_PROMPT } = require("../../prompts");
const learnerStateManager = require("../state/learnerStateManager");

class PromptBuilder {
  /**
   * Constructs the final system instruction by appending the dynamic learner state
   * to the base SYSTEM_PROMPT.
   */
  buildSystemInstruction(sessionId) {
    const state = learnerStateManager.getState(sessionId);
    
    // Round level to nearest whole number for the prompt instructions (1-5)
    const currentLevel = Math.round(state.level);
    
    // Format misconceptions
    const misconceptionsStr = state.misconceptions.length > 0 
        ? state.misconceptions.join(', ') 
        : 'None identified yet';

    // Format last answer
    const lastAnswerStr = state.last_answer_correct === null 
        ? 'N/A (First interaction or no previous question)' 
        : (state.last_answer_correct ? 'Yes' : 'No');

    // Build the dynamic injection block
    const stateContext = `
---
CURRENT LEARNER STATE (Context only, DO NOT output this):
- Topic: ${state.topic || 'Not set yet (Ask the user what they want to learn)'}
- Target Level: ${currentLevel}
- Understanding Score: ${state.understanding_score.toFixed(2)} (0 to 1)
- Known Misconceptions: ${misconceptionsStr}
- Was last answer correct?: ${lastAnswerStr}
- Is Testing Mode: ${state.is_testing ? 'YES (Generate a 3-question test now)' : 'NO (Follow standard teaching loop)'}
---
`;

    return SYSTEM_PROMPT + '\n' + stateContext;
  }
}

module.exports = new PromptBuilder();
