const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');

const Workspace = require('../models/Workspace');
const Board = require('../models/Board');
const User = require('../models/User');
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require('../errors');
const createHash = require('../utils/createHash');
const sendInvitationEmail = require('../utils/sendInvitationEmail');
const {
  uploadWorkspaceLogo: cloudinaryUploadLogo,
  deleteWorkspaceLogo: cloudinaryDeleteLogo,
} = require('../utils/cloudinary');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INVITATION_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

// ─── Workspace CRUD ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/workspaces
 * Create a new workspace. The creator is automatically assigned the 'owner' role.
 */
const createWorkspace = async (req, res) => {
  const { userId } = req.user;
  const { name, description } = req.body;

  if (!name) {
    throw new BadRequestError('Workspace name is required');
  }

  const workspace = await Workspace.create({
    name,
    description,
    members: [{ user: userId, role: 'admin', joinedAt: new Date() }],
  });

  res.status(StatusCodes.CREATED).json({ workspace });
};

/**
 * GET /api/v1/workspaces
 * Return all workspaces the authenticated user is a member of.
 */
const getMyWorkspaces = async (req, res) => {
  const { userId } = req.user;

  const workspaces = await Workspace.find({ 'members.user': userId })
    .select('-invitations') // do not expose pending invite tokens
    .sort({ updatedAt: -1 });

  res.status(StatusCodes.OK).json({ count: workspaces.length, workspaces });
};

/**
 * GET /api/v1/workspaces/:workspaceId
 * Get a single workspace. Membership is enforced by requireWorkspaceMember middleware.
 */
const getWorkspace = async (req, res) => {
  // req.workspace is populated by requireWorkspaceMember middleware
  const workspace = req.workspace.toObject();

  // Strip raw invitation tokens from the response
  if (workspace.invitations) {
    workspace.invitations = workspace.invitations.map(({ token, ...rest }) => rest);
  }

  res.status(StatusCodes.OK).json({ workspace });
};

/**
 * PATCH /api/v1/workspaces/:workspaceId
 * Update workspace name, description, or logo. Requires 'owner' or 'admin' role.
 */
const updateWorkspace = async (req, res) => {
  const { name, description } = req.body;
  const workspace = req.workspace;

  if (!name && description === undefined) {
    throw new BadRequestError('Please provide at least one field to update');
  }

  if (name) workspace.name = name;
  if (description !== undefined) workspace.description = description;

  await workspace.save();

  res.status(StatusCodes.OK).json({ workspace });
};

/**
 * PATCH /api/v1/workspaces/:workspaceId/logo
 * Upload a workspace logo image to Cloudinary.
 * Requires admin role. Body: multipart/form-data with field "logo".
 */
const uploadWorkspaceLogo = async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('Please provide a logo image');
  }

  const workspace = req.workspace;
  const result = await cloudinaryUploadLogo(req.file.buffer, workspace._id);

  workspace.logo = result.secure_url;
  await workspace.save();

  res.status(StatusCodes.OK).json({ workspace });
};

/**
 * DELETE /api/v1/workspaces/:workspaceId/logo
 * Remove the workspace logo from Cloudinary and clear the stored URL.
 */
const removeWorkspaceLogo = async (req, res) => {
  const workspace = req.workspace;

  if (workspace.logo) {
    await cloudinaryDeleteLogo(workspace._id);
    workspace.logo = '';
    await workspace.save();
  }

  res.status(StatusCodes.OK).json({ workspace });
};

/**
 * DELETE /api/v1/workspaces/:workspaceId
 * Permanently delete a workspace. Only the owner can do this.
 */
const deleteWorkspace = async (req, res) => {
  const workspace = req.workspace;

  if (req.memberRole !== 'admin') {
    throw new UnauthorizedError('Only workspace admins can delete it');
  }

  if (workspace.logo) {
    await cloudinaryDeleteLogo(workspace._id);
  }

  await Board.deleteMany({ workspace: workspace._id });
  await workspace.deleteOne();

  res.status(StatusCodes.OK).json({ msg: 'Workspace deleted successfully' });
};

// ─── Members ──────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/workspaces/:workspaceId/members
 * List all members of a workspace with their user info and roles.
 */
const getWorkspaceMembers = async (req, res) => {
  const workspace = await Workspace.findById(req.workspace._id).populate(
    'members.user',
    'firstName lastName email'
  );

  res.status(StatusCodes.OK).json({ members: workspace.members });
};

/**
 * PATCH /api/v1/workspaces/:workspaceId/members/:userId
 * Change a member's role. Only the owner can do this.
 * Cannot change the owner's own role via this endpoint.
 */
const updateMemberRole = async (req, res) => {
  const { userId: requestingUserId } = req.user;
  const { userId: targetUserId } = req.params;
  const { role } = req.body;

  if (req.memberRole !== 'admin') {
    throw new UnauthorizedError('Only workspace admins can change member roles');
  }

  if (!role || !['admin', 'member'].includes(role)) {
    throw new BadRequestError('Role must be one of: admin, member');
  }

  if (targetUserId === requestingUserId) {
    throw new BadRequestError('You cannot change your own role');
  }

  const workspace = req.workspace;
  const memberEntry = workspace.members.find(
    (m) => m.user.toString() === targetUserId
  );

  if (!memberEntry) {
    throw new NotFoundError('This user is not a member of the workspace');
  }

  memberEntry.role = role;
  await workspace.save();

  res.status(StatusCodes.OK).json({ msg: 'Member role updated', member: memberEntry });
};

/**
 * DELETE /api/v1/workspaces/:workspaceId/members/:userId
 * Remove a member from the workspace.
 *  - Owner can remove anyone except themselves (use leaveWorkspace for that, but owner must transfer first)
 *  - Admin can only remove 'member'-role users
 */
const removeMember = async (req, res) => {
  const { userId: requestingUserId } = req.user;
  const { userId: targetUserId } = req.params;
  const workspace = req.workspace;

  if (targetUserId === requestingUserId) {
    throw new BadRequestError('Use the leave endpoint to remove yourself');
  }

  const targetEntry = workspace.members.find(
    (m) => m.user.toString() === targetUserId
  );

  if (!targetEntry) {
    throw new NotFoundError('This user is not a member of the workspace');
  }

  // Members cannot remove admins
  if (req.memberRole === 'member') {
    throw new UnauthorizedError('Members do not have permission to remove other members');
  }

  workspace.members = workspace.members.filter(
    (m) => m.user.toString() !== targetUserId
  );

  await workspace.save();

  res.status(StatusCodes.OK).json({ msg: 'Member removed from workspace' });
};

/**
 * DELETE /api/v1/workspaces/:workspaceId/leave
 * Leave a workspace. The owner must transfer ownership before leaving.
 */
const leaveWorkspace = async (req, res) => {
  const { userId } = req.user;
  const workspace = req.workspace;

  const memberEntry = workspace.members.find(
    (m) => m.user.toString() === userId
  );

  if (!memberEntry) {
    throw new NotFoundError('You are not a member of this workspace');
  }

  const adminCount = workspace.members.filter((m) => m.role === 'admin').length;
  const isOnlyAdmin = memberEntry.role === 'admin' && adminCount === 1;

  workspace.members = workspace.members.filter((m) => m.user.toString() !== userId);

  if (isOnlyAdmin) {
    if (workspace.logo) {
      await cloudinaryDeleteLogo(workspace._id);
    }

    await Board.deleteMany({ workspace: workspace._id });
    await workspace.deleteOne();

    res.status(StatusCodes.OK).json({
      msg: 'You have left the workspace and it was deleted',
      deleted: true,
    });
    return;
  }

  await workspace.save();

  res.status(StatusCodes.OK).json({ msg: 'You have left the workspace', deleted: false });
};

// ─── Invitations ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/workspaces/:workspaceId/invite
 * Invite a user by email. Generates a hashed token and sends an invitation email.
 * Requires owner or admin role.
 */
const inviteMember = async (req, res) => {
  const { userId } = req.user;
  const { email, role = 'member' } = req.body;
  const workspace = req.workspace;

  if (!email) {
    throw new BadRequestError('Please provide an email address');
  }

  if (!['admin', 'member'].includes(role)) {
    throw new BadRequestError('Role must be one of: admin, member');
  }

  // Check if the email belongs to an existing member
  const existingUser = await User.findOne({ email });
  if (existingUser && workspace.isMember(existingUser._id)) {
    throw new BadRequestError('This user is already a member of the workspace');
  }

  // Remove any existing pending invitation for this email
  workspace.invitations = workspace.invitations.filter(
    (inv) => inv.email !== email.toLowerCase()
  );

  // Generate token
  const rawToken = crypto.randomBytes(40).toString('hex');
  const hashedToken = createHash(rawToken);
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS);

  workspace.invitations.push({
    email: email.toLowerCase(),
    role,
    token: hashedToken,
    expiresAt,
    invitedBy: userId,
  });

  await workspace.save();

  // Fetch inviter's name for the email
  const inviter = await User.findById(userId).select('firstName lastName');
  const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'A teammate';

  await sendInvitationEmail({
    inviteeName: existingUser ? existingUser.firstName : null,
    inviterName,
    email: email.toLowerCase(),
    workspaceName: workspace.name,
    inviteToken: rawToken,
    origin: process.env.CLIENT_ORIGIN,
  });

  res.status(StatusCodes.OK).json({
    msg: `Invitation sent to ${email}`,
    expiresAt,
  });
};

/**
 * POST /api/v1/workspaces/invite/accept
 * Accept a workspace invitation using the token + email from the invitation email link.
 * Body: { token, email }
 */
const acceptInvitation = async (req, res) => {
  const { token, email } = req.body;
  const { userId } = req.user;

  if (!token || !email) {
    throw new BadRequestError('Please provide invitation token and email');
  }

  const hashedToken = createHash(token);
  const now = new Date();

  // Find the workspace that has this invitation
  const workspace = await Workspace.findOne({
    invitations: {
      $elemMatch: {
        email: email.toLowerCase(),
        token: hashedToken,
        expiresAt: { $gt: now },
      },
    },
  });

  if (!workspace) {
    throw new BadRequestError('Invalid or expired invitation token');
  }

  // Make sure the logged-in user's email matches the invitation
  const invitedUser = await User.findById(userId).select('email');
  if (!invitedUser || invitedUser.email !== email.toLowerCase()) {
    throw new UnauthorizedError(
      'The invitation was sent to a different email address than your account'
    );
  }

  // Guard: already a member
  if (workspace.isMember(userId)) {
    throw new BadRequestError('You are already a member of this workspace');
  }

  const invitation = workspace.invitations.find(
    (inv) => inv.email === email.toLowerCase() && inv.token === hashedToken
  );

  // Add user as a member
  workspace.members.push({
    user: userId,
    role: invitation.role,
    joinedAt: new Date(),
  });

  // Remove the consumed invitation
  workspace.invitations = workspace.invitations.filter(
    (inv) => !(inv.email === email.toLowerCase() && inv.token === hashedToken)
  );

  await workspace.save();

  res.status(StatusCodes.OK).json({
    msg: `You have joined "${workspace.name}"`,
    workspaceId: workspace._id,
    role: invitation.role,
  });
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  uploadWorkspaceLogo,
  removeWorkspaceLogo,
  deleteWorkspace,
  getWorkspaceMembers,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  inviteMember,
  acceptInvitation,
};
