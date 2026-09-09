const { StatusCodes } = require('http-status-codes');
const { GoogleGenAI } = require('@google/genai');

const Board = require('../models/Board');
const CardEmbedding = require('../models/CardEmbedding');
const { createEmbedding } = require('../services/cardEmbeddings');
const { upsertCardEmbedding } = require('../services/cardEmbeddings');
const { BadRequestError, NotFoundError } = require('../errors');

const MAX_QUESTION_LENGTH = 1000;
const MAX_CONTEXT_LENGTH = 30000;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toAssistantContext = (board) => {
  const context = {
    board: {
      name: board.name,
      description: board.description || '',
    },
    lists: (board.columns || []).map((column) => ({
      name: column.title,
      cards: (column.cards || []).map((card) => ({
        title: card.title,
        description: card.description || '',
        priority: card.priority,
        dueDate: card.dueDate || null,
        labels: (card.labels || []).map((label) => label.name),
        assignees: (card.assignees || []).map((assignee) => {
          if (typeof assignee === 'object' && assignee !== null) {
            return [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || 'Unnamed member';
          }
          return 'Assigned member';
        }),
      })),
    })),
  };

  return JSON.stringify(context).slice(0, MAX_CONTEXT_LENGTH);
};

const askProjectAssistant = async (req, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';

  if (!question) throw new BadRequestError('A question is required');
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new BadRequestError(`Question must be at most ${MAX_QUESTION_LENGTH} characters`);
  }
  if (!process.env.GEMINI_API_KEY) {
    throw new BadRequestError('The AI assistant is not configured on the server');
  }

  const board = await Board.findOne({
    _id: req.params.boardId,
    workspace: req.workspace._id,
  }).populate('columns.cards.assignees', 'firstName lastName');

  if (!board) throw new NotFoundError('Board not found');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  let response;

  try {
    response = await ai.models.generateContent({
      model,
      contents: `Board data:\n${toAssistantContext(board)}\n\nUser question:\n${question}`,
      config: {
        systemInstruction:
          'You are a concise project-management assistant. Answer only from the supplied board data. If the data does not contain the answer, say so clearly. Do not invent people, dates, or task status. Return plain text only: do not use Markdown, asterisks, hashtags, backticks, or code blocks. Use short paragraphs and simple hyphen-prefixed lines when useful.',
      },
    });
  } catch (apiError) {
    const message = apiError?.message || 'The AI assistant could not answer right now';
    const isQuotaError = /quota|resource exhausted|billing|rate limit/i.test(message);
    const error = new Error(
      isQuotaError
        ? 'The AI assistant is temporarily unavailable because the Gemini API quota has been reached.'
        : message
    );
    error.statusCode = isQuotaError ? 402 : 502;
    throw error;
  }

  const answer = response.text?.trim();

  res.status(StatusCodes.OK).json({ answer: answer || 'I could not find an answer in this board.' });
};

const askWorkspaceAssistant = async (req, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question) throw new BadRequestError('A question is required');
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new BadRequestError(`Question must be at most ${MAX_QUESTION_LENGTH} characters`);
  }
  if (!process.env.GEMINI_API_KEY) {
    throw new BadRequestError('The AI assistant is not configured on the server');
  }

  const queryEmbedding = await createEmbedding(question);
  const vectorMatches = await CardEmbedding.aggregate([
    {
      $vectorSearch: {
        index: process.env.MONGODB_VECTOR_INDEX || 'card_embeddings_vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: 8,
        filter: { workspace: req.workspace._id },
      },
    },
    { $project: { content: 1, score: { $meta: 'vectorSearchScore' } } },
  ]);

  // Vector search is meaning-based, so exact card names and IDs also get a
  // keyword fallback. This prevents a specifically named card from being
  // missed just because its vector was not in the top results.
  const keywords = [...new Set(
    question
      .split(/\s+/)
      .map((word) => word.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter((word) => word.length >= 3)
  )];
  const keywordMatches = keywords.length
    ? await CardEmbedding.find({
        workspace: req.workspace._id,
        $or: keywords.map((keyword) => ({ content: { $regex: escapeRegex(keyword), $options: 'i' } })),
      }).select('content').limit(8).lean()
    : [];

  const seenContent = new Set();
  const matches = [...keywordMatches, ...vectorMatches].filter((match) => {
    if (seenContent.has(match.content)) return false;
    seenContent.add(match.content);
    return true;
  }).slice(0, 8);

  const context = matches.map((match, index) => `Result ${index + 1}:\n${match.content}`).join('\n\n');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let response;
  try {
    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      contents: `Workspace card data:\n${context || 'No relevant cards were found.'}\n\nUser question:\n${question}`,
      config: {
        systemInstruction:
          'You are a concise workspace project assistant. Answer only from the supplied card data. If the data does not contain the answer, say so clearly. Do not invent facts. Return plain text only: do not use Markdown, asterisks, hashtags, backticks, or code blocks.',
      },
    });
  } catch (apiError) {
    const error = new Error(apiError?.message || 'The AI assistant could not answer right now');
    error.statusCode = 502;
    throw error;
  }

  res.status(StatusCodes.OK).json({ answer: response.text?.trim() || 'I could not find an answer in this workspace.' });
};

const indexWorkspaceCards = async (req, res) => {
  if (!process.env.GEMINI_API_KEY) throw new BadRequestError('The AI assistant is not configured on the server');
  const boards = await Board.find({ workspace: req.workspace._id })
    .populate('columns.cards.assignees', 'firstName lastName');
  let indexed = 0;
  for (const board of boards) {
    for (const column of board.columns || []) {
      for (const card of column.cards || []) {
        await upsertCardEmbedding({
          workspaceId: board.workspace,
          boardId: board._id,
          boardName: board.name,
          columnName: column.title,
          card,
        });
        indexed += 1;
      }
    }
  }
  res.status(StatusCodes.OK).json({ indexed });
};

module.exports = { askProjectAssistant, askWorkspaceAssistant, indexWorkspaceCards };
