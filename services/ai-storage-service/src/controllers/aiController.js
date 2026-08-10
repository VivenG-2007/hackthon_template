const { body } = require('express-validator');
const { runChat } = require('../services/aiService');

const chatValidators = [
  body('messages').isArray({ min: 1 }).withMessage('messages must be a non-empty array'),
  body('messages.*.role').isIn(['user', 'assistant', 'system']),
  body('messages.*.content').isString().isLength({ min: 1, max: 8000 }),
];

// POST /api/ai/chat — general-purpose conversational endpoint, persists to Conversation.
async function chat(req, res, next) {
  try {
    const { messages, model, conversationId } = req.body;
    const result = await runChat({ ownerId: req.user.id, messages, model, conversationId });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

// POST /api/ai/generate — single-shot generation, no conversation persistence.
// Same underlying provider call; kept separate so you can diverge behavior later
// (e.g. different default temperature/max_tokens) without branching /chat.
async function generate(req, res, next) {
  try {
    const { prompt, model } = req.body;
    if (!prompt) return res.status(400).json({ error: { message: '"prompt" is required', code: 'VALIDATION_ERROR', requestId: req.id } });
    const result = await runChat({ ownerId: null, messages: [{ role: 'user', content: prompt }], model, useCache: true });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

// POST /api/ai/analyze — structured-ish variant: wraps input with an instruction
// prefix. Replace with real structured-output / function-calling once you pick
// a concrete hackathon use case.
async function analyze(req, res, next) {
  try {
    const { input, instructions, model } = req.body;
    if (!input) return res.status(400).json({ error: { message: '"input" is required', code: 'VALIDATION_ERROR', requestId: req.id } });
    const messages = [
      { role: 'system', content: instructions || 'Analyze the following input and summarize the key points.' },
      { role: 'user', content: String(input).slice(0, 8000) },
    ];
    const result = await runChat({ ownerId: req.user?.id || null, messages, model, useCache: true });
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { chat, generate, analyze, chatValidators };
