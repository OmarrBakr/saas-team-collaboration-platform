import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { workspaceQueryKey } from "./useWorkspaceData";
import {
  inviteWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "../services/workspaces";

const getMemberId = (member) =>
  member?.user?._id || member?.user?.id || member?.user;
export default function useWorkspaceMembers({
  workspaceId,
  members,
  invitations,
  memberRoles,
  draftMemberRoles,
  setDraftMemberRoles,
}) {
  const queryClient = useQueryClient();
  const inviteMemberMutation = useMutation({
    mutationFn: ({ email }) => inviteWorkspaceMember(workspaceId, { email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceQueryKey(workspaceId) }),
  });
  const removeMemberMutation = useMutation({
    mutationFn: (id) => removeWorkspaceMember(workspaceId, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: workspaceQueryKey(workspaceId) });
      const previousWorkspace = queryClient.getQueryData(workspaceQueryKey(workspaceId));
      queryClient.setQueryData(workspaceQueryKey(workspaceId), (current) =>
        current
          ? {
              ...current,
              members: (current.members || []).filter(
                (member) => getMemberId(member)?.toString?.() !== id?.toString?.(),
              ),
            }
          : current,
      );
      return { previousWorkspace };
    },
    onError: (_error, _id, context) => {
      if (context?.previousWorkspace) {
        queryClient.setQueryData(workspaceQueryKey(workspaceId), context.previousWorkspace);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceQueryKey(workspaceId) }),
  });
  const updateRolesMutation = useMutation({
    mutationFn: (changedMembers) =>
      Promise.all(
        changedMembers.map(({ id, role }) =>
          updateWorkspaceMemberRole(workspaceId, id, role),
        ),
      ),
    onMutate: async (changedMembers) => {
      await queryClient.cancelQueries({ queryKey: workspaceQueryKey(workspaceId) });
      const previousWorkspace = queryClient.getQueryData(workspaceQueryKey(workspaceId));
      const changedRoles = new Map(
        changedMembers.map(({ id, role }) => [id?.toString?.(), role]),
      );
      queryClient.setQueryData(workspaceQueryKey(workspaceId), (current) =>
        current
          ? {
              ...current,
              members: (current.members || []).map((member) => {
                const id = getMemberId(member)?.toString?.();
                return changedRoles.has(id)
                  ? { ...member, role: changedRoles.get(id) }
                  : member;
              }),
            }
          : current,
      );
      return { previousWorkspace };
    },
    onError: (_error, _changedMembers, context) => {
      if (context?.previousWorkspace) {
        queryClient.setQueryData(workspaceQueryKey(workspaceId), context.previousWorkspace);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceQueryKey(workspaceId) }),
  });
  const [removingMemberId, setRemovingMemberId] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [manageError, setManageError] = useState("");

  const refreshMembers = async () => {
    await queryClient.refetchQueries({
      queryKey: workspaceQueryKey(workspaceId),
      type: "active",
    });
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
    try {
      const result = await inviteMemberMutation.mutateAsync({ email });
      await refreshMembers();
      setInviteMessage(result.msg || `Invitation sent to ${email}`);
      setInviteEmail("");
    } catch (err) {
      setInviteError(err.message || "Something went wrong");
    }
  };
  const handleRemoveMember = async (id) => {
    setRemovingMemberId(id?.toString?.() || id);
    setManageError("");
    try {
      await removeMemberMutation.mutateAsync(id);
      await refreshMembers();
    } catch (err) {
      setManageError(err.message || "Something went wrong");
    }
    setRemovingMemberId("");
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
    setManageError("");
    try {
      await updateRolesMutation.mutateAsync(
        changed.map((member) => {
          const id = getMemberId(member)?.toString?.();
          return { id, role: draftMemberRoles[id] };
        }),
      );
      await refreshMembers();
    } catch (err) {
      setManageError(err.message || "Something went wrong");
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
    isInviting: inviteMemberMutation.isPending,
    handleInviteMember,
    memberToRemove,
    isSavingRoles: updateRolesMutation.isPending,
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
