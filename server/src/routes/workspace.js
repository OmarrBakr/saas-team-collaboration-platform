const express = require('express');

const { logoUpload } = require('../middleware/upload');
const {
  invitationAdminLimiter,
  invitationWorkspaceLimiter,
} = require('../middleware/rate-limit');

const {
  requireWorkspaceMember,
  requireWorkspaceRole,
} = require('../middleware/workspace');

const {
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
} = require('../controllers/workspace');

const router = express.Router();

router.get('/', getMyWorkspaces);
router.post('/', createWorkspace);
router.post('/invite/accept', acceptInvitation);

router.get('/:workspaceId', requireWorkspaceMember, getWorkspace);
router.patch('/:workspaceId', requireWorkspaceRole('admin'), updateWorkspace);
router.patch(
  '/:workspaceId/logo',
  requireWorkspaceRole('admin'),
  logoUpload.single('logo'),
  uploadWorkspaceLogo
);
router.delete('/:workspaceId/logo', requireWorkspaceRole('admin'), removeWorkspaceLogo);
router.delete('/:workspaceId', requireWorkspaceRole('admin'), deleteWorkspace);

router.get('/:workspaceId/members', requireWorkspaceMember, getWorkspaceMembers);
router.patch('/:workspaceId/members/:userId', requireWorkspaceRole('admin'), updateMemberRole);
router.delete('/:workspaceId/members/:userId', requireWorkspaceRole('admin'), removeMember);
router.delete('/:workspaceId/leave', requireWorkspaceMember, leaveWorkspace);

router.post(
  '/:workspaceId/invite',
  requireWorkspaceRole('admin'),
  invitationAdminLimiter,
  invitationWorkspaceLimiter,
  inviteMember
);

module.exports = router;
