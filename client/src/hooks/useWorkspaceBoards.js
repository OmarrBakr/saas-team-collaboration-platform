import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

import { createBoard } from "../services/boards";
import { workspaceBoardsQueryKey } from "./useWorkspaceData";

export default function useWorkspaceBoards({
  workspaceId,
  boards = [],
  setBoards,
}) {
  const queryClient = useQueryClient();
  const createBoardMutation = useMutation({
    mutationFn: (payload) => createBoard(workspaceId, payload),
    onSuccess: (result) => {
      setBoards((current) => [...current, result.board]);
      queryClient.invalidateQueries({
        queryKey: workspaceBoardsQueryKey(workspaceId),
      });
    },
  });
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [createBoardError, setCreateBoardError] = useState("");
  const [createBoardForm, setCreateBoardForm] = useState({
    name: "",
    description: "",
  });

  const openCreateBoardModal = () => {
    setCreateBoardForm({ name: "", description: "" });
    setCreateBoardError("");
    setIsCreateBoardOpen(true);
  };

  const handleCreateBoardChange = ({ target: { name, value } }) => {
    setCreateBoardForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreateBoard = async (event) => {
    event.preventDefault();
    const name = createBoardForm.name.trim();
    if (!name) {
      setCreateBoardError("Board name is required.");
      return;
    }

    setCreateBoardError("");
    try {
      await createBoardMutation.mutateAsync({
        name,
        description: createBoardForm.description.trim(),
      });
      setIsCreateBoardOpen(false);
    } catch (err) {
      setCreateBoardError(err.message || "Something went wrong");
    }
  };

  return {
    boards,
    isCreateBoardOpen,
    setIsCreateBoardOpen,
    isCreatingBoard: createBoardMutation.isPending,
    createBoardError,
    createBoardForm,
    openCreateBoardModal,
    handleCreateBoardChange,
    handleCreateBoard,
  };
}
