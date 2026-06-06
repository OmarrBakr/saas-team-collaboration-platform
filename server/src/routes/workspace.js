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

router.get('/', getMyWorkspaces);
router.post('/', createWorkspace);
router.post('/invite/accept', acceptInvitation);

router.get('/:workspaceId', requireWorkspaceMember, getWorkspace);
router.patch('/:workspaceId', requireWorkspaceRole('admin'), updateWorkspace);
router.delete('/:workspaceId', requireWorkspaceRole('admin'), deleteWorkspace);

router.get('/:workspaceId/members', requireWorkspaceMember, getWorkspaceMembers);
router.patch('/:workspaceId/members/:userId', requireWorkspaceRole('admin'), updateMemberRole);
router.delete('/:workspaceId/members/:userId', requireWorkspaceRole('admin'), removeMember);
router.delete('/:workspaceId/leave', requireWorkspaceMember, leaveWorkspace);

router.post('/:workspaceId/invite', requireWorkspaceRole('admin'), inviteMember);

module.exports = router;