const { GoogleGenAI } = require('@google/genai');
const CardEmbedding = require('../models/CardEmbedding');

const getAi = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const cardText = ({ boardName, columnName, card, assigneeNames = [] }) => [
  `Board: ${boardName}`,
  `List: ${columnName}`,
  `Title: ${card.title}`,
  `Description: ${card.description || 'None'}`,
  `Status: ${columnName}`,
  `Priority: ${card.priority || 'medium'}`,
  `Due date: ${card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : 'None'}`,
  `Labels: ${(card.labels || []).map((label) => label.name).join(', ') || 'None'}`,
  `Assignees: ${assigneeNames.join(', ') || 'Unassigned'}`,
].join('\n');

const createEmbedding = async (content) => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
  const result = await getAi().models.embedContent({
    model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    contents: content,
  });
  const values = result?.embeddings?.[0]?.values;
  if (!Array.isArray(values) || values.length === 0) throw new Error('Gemini returned an empty embedding');
  return values;
};

const upsertCardEmbedding = async ({ workspaceId, boardId, boardName, columnName, card }) => {
  const assigneeNames = (card.assignees || []).map((assignee) =>
    typeof assignee === 'object'
      ? [assignee.firstName, assignee.lastName].filter(Boolean).join(' ')
      : 'Assigned member'
  );
  const content = cardText({ boardName, columnName, card, assigneeNames });
  const embedding = await createEmbedding(content);
  return CardEmbedding.findOneAndUpdate(
    { card: card._id },
    { workspace: workspaceId, board: boardId, card: card._id, content, embedding },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const deleteCardEmbedding = (cardId) => CardEmbedding.deleteOne({ card: cardId });

module.exports = { upsertCardEmbedding, deleteCardEmbedding, createEmbedding };
