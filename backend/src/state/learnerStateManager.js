const logger = require("../../logger");

class LearnerStateManager {
  constructor() {
    // In-memory store: Map<sessionId, StateObject>
    this.states = new Map();
  }

  /**
   * Retrieves the state for a given session. Creates a new one if it doesn't exist.
   */
  getState(sessionId) {
    if (!sessionId) {
      logger.warn("No sessionId provided to LearnerStateManager");
      return this._getDefaultState();
    }

    if (!this.states.has(sessionId)) {
      logger.info(`Creating new learner state for session: ${sessionId}`);
      this.states.set(sessionId, this._getDefaultState());
    }

    return this.states.get(sessionId);
  }

  /**
   * Updates specific fields in the session state.
   */
  updateState(sessionId, updates) {
    if (!sessionId) return;
    
    const currentState = this.getState(sessionId);
    const newState = { ...currentState, ...updates };
    
    // Enforce bounds
    if (newState.level < 1) newState.level = 1;
    if (newState.level > 5) newState.level = 5;
    if (newState.understanding_score < 0) newState.understanding_score = 0;
    if (newState.understanding_score > 1) newState.understanding_score = 1;

    this.states.set(sessionId, newState);
    logger.debug(`Updated state for ${sessionId}`, { newState });
    return newState;
  }

  /**
   * Adds a misconception to the list without overwriting the others.
   */
  addMisconception(sessionId, misconception) {
    if (!sessionId || !misconception) return;
    
    const state = this.getState(sessionId);
    if (!state.misconceptions.includes(misconception)) {
      this.updateState(sessionId, {
        misconceptions: [...state.misconceptions, misconception]
      });
    }
  }

  _getDefaultState() {
    return {
      topic: null,
      level: 2, // Default level
      understanding_score: 0.5,
      misconceptions: [],
      depth_preference_known: false,
      last_answer_correct: null
    };
  }
}

// Export a singleton instance
module.exports = new LearnerStateManager();
