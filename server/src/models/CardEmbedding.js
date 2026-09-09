const mongoose = require('mongoose');

const CardEmbeddingSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    card: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

CardEmbeddingSchema.index({ workspace: 1, board: 1 });

module.exports = mongoose.model('CardEmbedding', CardEmbeddingSchema);
