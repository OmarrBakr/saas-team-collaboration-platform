import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getWorkspace, getWorkspaceBoards } from "../services/workspaces";

const idOf = (member) => member?.user?._id || member?.user?.id || member?.user;
const rolesOf = (members) =>
  Object.fromEntries(
    members.map((member) => [idOf(member)?.toString?.(), member.role]),
  );

export default function useWorkspaceData(
  workspaceId,
  { includeBoards = true } = {},
) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [memberRoles, setMemberRoles] = useState({});
  const [draftMemberRoles, setDraftMemberRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const requests = [getWorkspace(workspaceId)];
        if (includeBoards) requests.push(getWorkspaceBoards(workspaceId));
        const [workspaceResult, boardsResult] = await Promise.all(requests);
        if (cancelled) return;
        const next = workspaceResult.workspace;
        const nextMembers = next?.members || [];
        const roles = rolesOf(nextMembers);
        setWorkspace(next);
        setBoards(includeBoards ? boardsResult?.boards || [] : []);
        setMembers(nextMembers);
        setInvitations(next?.invitations || []);
        setMemberRoles(roles);
        setDraftMemberRoles(roles);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, includeBoards]);
  const userId = user?._id || user?.id;
  const email = user?.email?.toLowerCase?.();
  const currentMember = members.find(
    (member) =>
      idOf(member)?.toString?.() === userId?.toString?.() ||
      (email && member.user?.email?.toLowerCase?.() === email),
  );
  const adminCount = members.filter((member) => member.role === "admin").length;
  return {
    workspace,
    setWorkspace,
    boards,
    setBoards,
    members,
    setMembers,
    invitations,
    setInvitations,
    memberRoles,
    setMemberRoles,
    draftMemberRoles,
    setDraftMemberRoles,
    loading,
    error,
    setError,
    currentMember,
    currentMemberId: idOf(currentMember),
    isAdmin: currentMember?.role === "admin",
    isOnlyAdmin: currentMember?.role === "admin" && adminCount === 1,
  };
}
