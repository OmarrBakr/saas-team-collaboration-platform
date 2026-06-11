const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Card title is required'],
      trim: true,
      maxlength: [120, 'Card title must be at most 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Card description must be at most 1000 characters'],
      default: '',
    },
    assignees: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    labels: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [30, 'Label name must be at most 30 characters'],
          },
          color: {
            type: String,
            required: true,
            trim: true,
            maxlength: [20, 'Label color must be at most 20 characters'],
          },
        },
      ],
      default: [],
    },
    attachments: {
      type: [
        {
          title: {
            type: String,
            required: true,
            trim: true,
          },
          url: {
            type: String,
            required: true,
          },
          publicId: {
            type: String,
            required: true,
          },
          mimeType: {
            type: String,
            default: '',
          },
          resourceType: {
            type: String,
            default: 'image',
          },
          size: {
            type: Number,
            default: 0,
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    position: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const ColumnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Column title is required'],
      trim: true,
      maxlength: [60, 'Column title must be at most 60 characters'],
    },
    position: {
      type: Number,
      required: true,
    },
    cards: {
      type: [CardSchema],
      default: [],
    },
  },
  { _id: true }
);

const BoardSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
      minlength: [2, 'Board name must be at least 2 characters'],
      maxlength: [80, 'Board name must be at most 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Board description must be at most 250 characters'],
      default: '',
    },
    columns: {
      type: [ColumnSchema],
      default: [
        { title: 'To Do', position: 0, cards: [] },
        { title: 'In Progress', position: 1, cards: [] },
        { title: 'Done', position: 2, cards: [] },
      ],
    },
  },
  { timestamps: true }
);

BoardSchema.index({ workspace: 1, updatedAt: -1 });

module.exports = mongoose.model('Board', BoardSchema);
