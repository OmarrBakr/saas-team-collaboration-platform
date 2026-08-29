import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getBoard } from "../services/boards";
import { getWorkspace } from "../services/workspaces";

export default function useBoardData(workspaceId, boardId) {
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [boardResult, workspaceResult] = await Promise.all([
          getBoard(workspaceId, boardId),
          getWorkspace(workspaceId),
        ]);
        if (cancelled) return;
        const nextMembers = workspaceResult.workspace?.members || [];
        setBoard(boardResult.board);
        setWorkspaceMembers(nextMembers);
        const currentUserId = user?.id || user?._id || "";
        const member = nextMembers.find((entry) => {
          const id = entry.user?._id || entry.user?.id || entry.user;
          return id?.toString?.() === currentUserId?.toString?.();
        });
        setIsAdmin(member?.role === "admin");
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId, boardId, user?.id, user?._id]);

  return {
    board,
    setBoard,
    loading,
    error,
    setError,
    workspaceMembers,
    isAdmin,
  };
}
