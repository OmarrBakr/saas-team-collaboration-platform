import { useState } from "react";
import {
  getWorkspace,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "../services/workspaces";

const getMemberId = (member) =>
  member?.user?._id || member?.user?.id || member?.user;
const getRoles = (members) =>
  Object.fromEntries(
    members.map((member) => [getMemberId(member)?.toString?.(), member.role]),
  );

export default function useWorkspaceMembers({
  workspaceId,
  members,
  invitations,
  setWorkspace,
  setMembers,
  setInvitations,
  memberRoles,
  setMemberRoles,
  draftMemberRoles,
  setDraftMemberRoles,
}) {
  const [removingMemberId, setRemovingMemberId] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [manageError, setManageError] = useState("");

  const refreshMembers = async () => {
    const result = await getWorkspace(workspaceId);
    const nextWorkspace = result.workspace;
    const nextMembers = nextWorkspace?.members || [];
    const roles = getRoles(nextMembers);
    setWorkspace(nextWorkspace);
    setMembers(nextMembers);
    setInvitations(nextWorkspace?.invitations || []);
    setMemberRoles(roles);
    setDraftMemberRoles(roles);
  };
  const handleInviteMember = async (event) => {
    event.preventDefault();
    setInviteError("");
    setInviteMessage("");
    const email = inviteEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setInviteError("Please enter a valid email address.");
    const normalized = email.toLowerCase();
    if (
      members.some(
        (member) => member.user?.email?.toLowerCase?.() === normalized,
      )
    )
      return setInviteError("This user is already a member of the workspace.");
    if (
      invitations.some(
        (invitation) => invitation.email?.toLowerCase?.() === normalized,
      )
    )
      return setInviteError(
        "An active invitation already exists for this email.",
      );
    setIsInviting(true);
    try {
      const result = await inviteWorkspaceMember(workspaceId, { email });
      await refreshMembers();
      setInviteMessage(result.msg || `Invitation sent to ${email}`);
      setInviteEmail("");
    } catch (err) {
      setInviteError(err.message || "Something went wrong");
    } finally {
      setIsInviting(false);
    }
  };
  const handleRemoveMember = async (id) => {
    setRemovingMemberId(id?.toString?.() || id);
    setManageError("");
    try {
      await removeWorkspaceMember(workspaceId, id);
      await refreshMembers();
    } catch (err) {
      setManageError(err.message || "Something went wrong");
    } finally {
      setRemovingMemberId("");
    }
  };
  const openManageModal = () => {
    setManageError("");
    setDraftMemberRoles(memberRoles);
    setIsManageOpen(true);
  };
  const handleDraftRoleChange = (id, role) =>
    setDraftMemberRoles((current) => ({
      ...current,
      [id?.toString?.() || id]: role,
    }));
  const hasRoleChanges = members.some((member) => {
    const id = getMemberId(member)?.toString?.();
    return id && draftMemberRoles[id] !== memberRoles[id];
  });
  const handleSaveRoles = async () => {
    const changed = members.filter((member) => {
      const id = getMemberId(member)?.toString?.();
      return id && draftMemberRoles[id] !== memberRoles[id];
    });
    if (!changed.length) return;
    setIsSavingRoles(true);
    setManageError("");
    try {
      await Promise.all(
        changed.map((member) => {
          const id = getMemberId(member)?.toString?.();
          return updateWorkspaceMemberRole(
            workspaceId,
            id,
            draftMemberRoles[id],
          );
        }),
      );
      await refreshMembers();
    } catch (err) {
      setManageError(err.message || "Something went wrong");
    } finally {
      setIsSavingRoles(false);
    }
  };
  const openRemoveMemberModal = (member) => {
    setManageError("");
    setMemberToRemove(member);
  };
  const closeRemoveMemberModal = () => {
    if (!removingMemberId) setMemberToRemove(null);
  };
  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    await handleRemoveMember(getMemberId(memberToRemove));
    setMemberToRemove(null);
  };
  return {
    removingMemberId,
    isInviteOpen,
    setIsInviteOpen,
    isManageOpen,
    setIsManageOpen,
    inviteEmail,
    setInviteEmail,
    inviteError,
    inviteMessage,
    isInviting,
    handleInviteMember,
    memberToRemove,
    isSavingRoles,
    manageError,
    memberRoles,
    draftMemberRoles,
    hasRoleChanges,
    handleDraftRoleChange,
    handleSaveRoles,
    openManageModal,
    openRemoveMemberModal,
    closeRemoveMemberModal,
    confirmRemoveMember,
    handleRemoveMember,
    refreshMembers,
  };
}
