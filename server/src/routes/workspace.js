const express = require('express');

const {
  requireWorkspaceMember,
  requireWorkspaceRole,
} = require('../middleware/workspace');

const {
  createWorkspace,
  getMyWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  updateMemberRole,
  removeMember,
  leaveWorkspace,
  inviteMember,
  acceptInvitation,
} = require('../controllers/workspace');

const router = express.Router();

// ─── Non-workspace-scoped routes ──────────────────────────────────────────────

// List all workspaces for the current user
router.get('/', getMyWorkspaces);

// Create a new workspace
router.post('/', createWorkspace);

// Accept a workspace invitation (token + email in body; no workspaceId yet)
router.post('/invite/accept', acceptInvitation);

// ─── Workspace-scoped routes ─────────────────────────────────────────────────
// All routes below verify the user is a member of :workspaceId

router.get('/:workspaceId', requireWorkspaceMember, getWorkspace);

router.patch(
  '/:workspaceId',
  requireWorkspaceRole('admin'),
  updateWorkspace
);

router.delete(
  '/:workspaceId',
  requireWorkspaceRole('admin'),
  deleteWorkspace
);

// ─── Members ──────────────────────────────────────────────────────────────────

router.get(
  '/:workspaceId/members',
  requireWorkspaceMember,
  getWorkspaceMembers
);

// Change a member's role — admin only
router.patch(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole('admin'),
  updateMemberRole
);

// Remove a member — admin
router.delete(
  '/:workspaceId/members/:userId',
  requireWorkspaceRole('admin'),
  removeMember
);

// Leave the workspace
router.delete(
  '/:workspaceId/leave',
  requireWorkspaceMember,
  leaveWorkspace
);

// ─── Invitations ──────────────────────────────────────────────────────────────

// Send an invitation — admin
router.post(
  '/:workspaceId/invite',
  requireWorkspaceRole('admin'),
  inviteMember
);

module.exports = router;
