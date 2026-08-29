import { useEffect } from "react";

import { subscribeToBoardUpdates } from "../services/socket";

export default function useBoardRealtime({
  user,
  boardId,
  workspaceId,
  navigate,
  setBoard,
}) {
  useEffect(() => {
    if (!user || !boardId) return undefined;
    return subscribeToBoardUpdates(boardId, (eventName, payload) => {
      if (eventName === "board:updated" && payload.deleted) {
        navigate(`/workspaces/${workspaceId}`);
        return;
      }
      if (payload.board) setBoard(payload.board);
    });
  }, [user, boardId, workspaceId, navigate, setBoard]);
}
