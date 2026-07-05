import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import {
  deleteWorkspace,
  getWorkspace,
  getWorkspaceBoards,
  getWorkspaceMembers,
  inviteWorkspaceMember,
  leaveWorkspace,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
  uploadWorkspaceLogo,
} from '../services/workspaces';

export default function useWorkspacePage(workspaceId, options = {}) {
  const { includeBoards = true } = options;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [destructiveAction, setDestructiveAction] = useState('leave');
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState('');
  const [editInitialForm, setEditInitialForm] = useState({ name: '', description: '', logo: '' });
  const [removingMemberId, setRemovingMemberId] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [memberRoles, setMemberRoles] = useState({});
  const [draftMemberRoles, setDraftMemberRoles] = useState({});
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [manageError, setManageError] = useState('');

  useEffect(() => {
    const loadWorkspace = async () => {
      setLoading(true);
      setError('');

      try {
        const requests = [getWorkspace(workspaceId), getWorkspaceMembers(workspaceId)];
        if (includeBoards) {
          requests.splice(1, 0, getWorkspaceBoards(workspaceId));
        }

        const [workspaceResult, boardsResultOrMembersResult, maybeMembersResult] = await Promise.all(requests);
        const boardsResult = includeBoards ? boardsResultOrMembersResult : null;
        const membersResult = includeBoards ? maybeMembersResult : boardsResultOrMembersResult;

        const nextWorkspace = workspaceResult.workspace;
        setWorkspace(nextWorkspace);
        setEditForm({
          name: nextWorkspace?.name || '',
          description: nextWorkspace?.description || '',
        });
        setEditLogoPreview(nextWorkspace?.logo || '');
        setEditLogoFile(null);
        setEditInitialForm({
          name: nextWorkspace?.name || '',
          description: nextWorkspace?.description || '',
          logo: nextWorkspace?.logo || '',
        });

        const nextMembers = membersResult.members || [];
        const nextInvitations = membersResult.invitations || [];
        setBoards(includeBoards ? boardsResult?.boards || [] : []);
        setMembers(nextMembers);
        setInvitations(nextInvitations);
        const roles = Object.fromEntries(
          nextMembers.map((member) => [
            (member.user?._id || member.user?.id || member.user)?.toString?.(),
            member.role,
          ])
        );
        setMemberRoles(roles);
        setDraftMemberRoles(roles);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [workspaceId]);

  const userId = user?._id || user?.id;
  const userEmail = user?.email?.toLowerCase?.();
  const currentMember = members.find((member) => {
    const memberUserId = member.user?._id || member.user?.id || member.user;
    const memberEmail = member.user?.email?.toLowerCase?.();
    return (
      memberUserId?.toString?.() === userId?.toString?.() ||
      (userEmail && memberEmail === userEmail)
    );
  });
  const currentMemberId = currentMember?.user?._id || currentMember?.user?.id || currentMember?.user;
  const adminCount = members.filter((member) => member.role === 'admin').length;
  const isOnlyAdmin = currentMember?.role === 'admin' && adminCount === 1;
  const isAdmin = currentMember?.role === 'admin';

  const refreshMembers = async () => {
    const membersResult = await getWorkspaceMembers(workspaceId);
    const nextMembers = membersResult.members || [];
    const nextInvitations = membersResult.invitations || [];
    setMembers(nextMembers);
    setInvitations(nextInvitations);
    const roles = Object.fromEntries(
      nextMembers.map((member) => [
        (member.user?._id || member.user?.id || member.user)?.toString?.(),
        member.role,
      ])
    );
    setMemberRoles(roles);
    setDraftMemberRoles(roles);
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    setLeaveError('');

    try {
      const result = await leaveWorkspace(workspaceId);
      setIsLeaveOpen(false);

      if (result.deleted) {
        navigate('/');
        return;
      }

      navigate('/');
    } catch (err) {
      setLeaveError(err.message || 'Something went wrong');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDelete = async () => {
    setIsLeaving(true);
    setLeaveError('');

    try {
      await deleteWorkspace(workspaceId);
      setIsLeaveOpen(false);
      navigate('/');
    } catch (err) {
      setLeaveError(err.message || 'Something went wrong');
    } finally {
      setIsLeaving(false);
    }
  };

  const openEditModal = () => {
    setEditError('');
    const name = workspace?.name || '';
    const description = workspace?.description || '';
    const logo = workspace?.logo || '';
    setEditForm({ name, description });
    setEditLogoPreview(logo);
    setEditLogoFile(null);
    setEditInitialForm({ name, description, logo });
    setIsEditOpen(true);
  };

  const handleEditLogoChange = (event) => {
    const file = event.target.files?.[0];
    setEditLogoFile(file || null);

    if (!file) {
      setEditLogoPreview(workspace?.logo || '');
      return;
    }

    setEditLogoPreview(URL.createObjectURL(file));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setEditError('');

    const trimmedName = editForm.name.trim();
    const trimmedDescription = editForm.description.trim();

    if (!trimmedName) {
      setEditError('Workspace name is required.');
      return;
    }

    setIsEditingWorkspace(true);

    try {
      const result = await updateWorkspace(workspaceId, {
        name: trimmedName,
        description: trimmedDescription,
      });

      let updatedWorkspace = result.workspace;

      if (editLogoFile) {
        const logoResult = await uploadWorkspaceLogo(workspaceId, editLogoFile);
        updatedWorkspace = logoResult.workspace;
      }

      setWorkspace(updatedWorkspace);
      setEditLogoFile(null);
      setEditLogoPreview(updatedWorkspace?.logo || '');
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err.message || 'Something went wrong');
    } finally {
      setIsEditingWorkspace(false);
    }
  };

  const hasWorkspaceEditChanges =
    editForm.name.trim() !== editInitialForm.name.trim() ||
    editForm.description.trim() !== editInitialForm.description.trim() ||
    Boolean(editLogoFile) ||
    (editLogoPreview || '') !== (editInitialForm.logo || '');

  const handleRemoveMember = async (memberUserId) => {
    setRemovingMemberId(memberUserId?.toString?.() || memberUserId);
    setLeaveError('');

    try {
      await removeWorkspaceMember(workspaceId, memberUserId);
      await refreshMembers();
    } catch (err) {
      setLeaveError(err.message || 'Something went wrong');
    } finally {
      setRemovingMemberId('');
    }
  };

  const openManageModal = () => {
    setManageError('');
    setDraftMemberRoles(memberRoles);
    setIsManageOpen(true);
  };

  const handleDraftRoleChange = (memberUserId, nextRole) => {
    const memberKey = memberUserId?.toString?.() || memberUserId;
    setDraftMemberRoles((current) => ({ ...current, [memberKey]: nextRole }));
  };

  const hasRoleChanges = members.some((member) => {
    const memberKey = (member.user?._id || member.user?.id || member.user)?.toString?.();
    return memberKey && draftMemberRoles[memberKey] && draftMemberRoles[memberKey] !== memberRoles[memberKey];
  });

  const handleSaveRoles = async () => {
    const changedMembers = members.filter((member) => {
      const memberKey = (member.user?._id || member.user?.id || member.user)?.toString?.();
      return memberKey && draftMemberRoles[memberKey] && draftMemberRoles[memberKey] !== memberRoles[memberKey];
    });

    if (changedMembers.length === 0) {
      return;
    }

    setIsSavingRoles(true);
    setManageError('');

    try {
      await Promise.all(
        changedMembers.map((member) => {
          const memberKey = (member.user?._id || member.user?.id || member.user)?.toString?.();
          return updateWorkspaceMemberRole(workspaceId, memberKey, draftMemberRoles[memberKey]);
        })
      );

      await refreshMembers();
    } catch (err) {
      setManageError(err.message || 'Something went wrong');
      await refreshMembers();
    } finally {
      setIsSavingRoles(false);
    }
  };

  const openRemoveMemberModal = (member) => {
    setLeaveError('');
    setMemberToRemove(member);
  };

  const closeRemoveMemberModal = () => {
    if (isLeaving || removingMemberId) return;
    setMemberToRemove(null);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    await handleRemoveMember(memberToRemove.user?._id || memberToRemove.user?.id || memberToRemove.user);
    setMemberToRemove(null);
  };

  const handleInviteMember = async (event) => {
    event.preventDefault();
    setInviteError('');
    setInviteMessage('');

    const trimmedEmail = inviteEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValidEmail) {
      setInviteError('Please enter a valid email address.');
      return;
    }

    setIsInviting(true);

    try {
      const result = await inviteWorkspaceMember(workspaceId, { email: trimmedEmail });
      await refreshMembers();
      setInviteMessage(result.msg || `Invitation sent to ${trimmedEmail}`);
      setInviteEmail('');
    } catch (err) {
      setInviteError(err.message || 'Something went wrong');
    } finally {
      setIsInviting(false);
    }
  };

  return {
    user,
    navigate,
    workspace,
    boards,
    members,
    invitations,
    loading,
    error,
    isOnlyAdmin,
    isAdmin,
    currentMemberId,
    isLeaveOpen,
    setIsLeaveOpen,
    destructiveAction,
    setDestructiveAction,
    isLeaving,
    leaveError,
    handleLeave,
    handleDelete,
    isEditOpen,
    setIsEditOpen,
    isEditingWorkspace,
    editError,
    editForm,
    handleEditChange,
    handleEditSubmit,
    editLogoPreview,
    handleEditLogoChange,
    hasWorkspaceEditChanges,
    openEditModal,
    isInviteOpen,
    setIsInviteOpen,
    inviteEmail,
    setInviteEmail,
    inviteError,
    inviteMessage,
    isInviting,
    handleInviteMember,
    isManageOpen,
    setIsManageOpen,
    memberRoles,
    draftMemberRoles,
    handleDraftRoleChange,
    hasRoleChanges,
    handleSaveRoles,
    isSavingRoles,
    manageError,
    openManageModal,
    memberToRemove,
    openRemoveMemberModal,
    closeRemoveMemberModal,
    confirmRemoveMember,
    removingMemberId,
    handleRemoveMember,
  };
}
