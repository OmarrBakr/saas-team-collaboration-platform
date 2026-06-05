const Workspace = require('../models/Workspace');
const { UnauthorizedError, NotFoundError } = require('../errors');

/**
 * requireWorkspaceMember
 * ──────────────────────
 * Verifies the authenticated user is a member of the workspace identified by
 * `req.params.workspaceId`. On success, attaches:
 *   - `req.workspace`   — the full Workspace document
 *   - `req.memberRole`  — the user's role in that workspace
 */
const requireWorkspaceMember = async (req, res, next) => {
  const { userId } = req.user;
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return next(); // no workspace scoping needed on this route
  }

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    throw new NotFoundError(`No workspace found with id ${workspaceId}`);
  }

  const role = workspace.getMemberRole(userId);

  if (!role) {
    throw new UnauthorizedError('You are not a member of this workspace');
  }

  req.workspace = workspace;
  req.memberRole = role;
  next();
};

/**
 * requireWorkspaceRole(...roles)
 * ──────────────────────────────
 * Factory that returns middleware gating access to users whose workspace role
 * is included in the provided `roles` array.
 *
 * Usage:
 *   router.patch('/...', authenticateUser, requireWorkspaceRole('admin'), handler)
 */
const requireWorkspaceRole = (...roles) => {
  return async (req, res, next) => {
    // Ensure membership has already been resolved (call requireWorkspaceMember first)
    if (!req.workspace) {
      await requireWorkspaceMember(req, res, async () => {});
      if (!req.workspace) return; // error already thrown inside
    }

    if (!roles.includes(req.memberRole)) {
      throw new UnauthorizedError(
        `This action requires one of the following roles: ${roles.join(', ')}`
      );
    }

    next();
  };
};

module.exports = { requireWorkspaceMember, requireWorkspaceRole };
