import { useAuth } from "../context/AuthContext";
import useWorkspaceBoards from "./useWorkspaceBoards";
import useWorkspaceHeader from "./useWorkspaceHeader";
import useWorkspaceMembers from "./useWorkspaceMembers";
import useWorkspaceData from "./useWorkspaceData";

export default function useWorkspacePage(workspaceId, options = {}) {
  const { includeBoards = true } = options;
  const { onlineUserIds } = useAuth();
  const data = useWorkspaceData(workspaceId, { includeBoards });
  const header = useWorkspaceHeader({
    workspaceId,
    workspace: data.workspace,
    setWorkspace: data.setWorkspace,
  });
  const boards = useWorkspaceBoards({
    workspaceId,
    boards: data.boards,
    setBoards: data.setBoards,
  });
  const members = useWorkspaceMembers({
    workspaceId,
    members: data.members,
    invitations: data.invitations,
    setWorkspace: data.setWorkspace,
    memberRoles: data.memberRoles,
    draftMemberRoles: data.draftMemberRoles,
    setDraftMemberRoles: data.setDraftMemberRoles,
  });

  return {
    ...data,
    ...header,
    ...boards,
    ...members,
    onlineMemberIds: onlineUserIds,
  };
}
