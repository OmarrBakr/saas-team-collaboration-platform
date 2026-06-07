const mongoose = require('mongoose');

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const MemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const InvitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: true }
);

// ─── Workspace schema ─────────────────────────────────────────────────────────

const WorkspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description must be at most 200 characters'],
      default: '',
    },
    // URL-friendly identifier auto-generated from name
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    // Cloudinary secure URL for the workspace logo
    logo: {
      type: String,
      default: '',
    },
    members: {
      type: [MemberSchema],
      default: [],
    },
    invitations: {
      type: [InvitationSchema],
      default: [],
    },
    // Auto-created personal workspace on registration
    isPersonal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

WorkspaceSchema.index({ 'members.user': 1 });

// ─── Pre-save: generate a unique slug from name ───────────────────────────────

WorkspaceSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    const base = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    // Append a short random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).slice(2, 7);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

// ─── Instance methods ─────────────────────────────────────────────────────────

/**
 * Returns the role string ('admin' | 'member') for the given userId,
 * or null if the user is not a member.
 */
WorkspaceSchema.methods.getMemberRole = function (userId) {
  const entry = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  return entry ? entry.role : null;
};

/**
 * Returns true if the given userId is a member of this workspace.
 */
WorkspaceSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

module.exports = mongoose.model('Workspace', WorkspaceSchema);
