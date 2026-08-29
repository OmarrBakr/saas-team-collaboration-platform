import { useState } from "react";

import { createBoard } from "../services/boards";

export default function useWorkspaceBoards({
  workspaceId,
  boards = [],
  setBoards,
}) {
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
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

    setIsCreatingBoard(true);
    setCreateBoardError("");
    try {
      const result = await createBoard(workspaceId, {
        name,
        description: createBoardForm.description.trim(),
      });
      setBoards([...boards, result.board]);
      setIsCreateBoardOpen(false);
    } catch (err) {
      setCreateBoardError(err.message || "Something went wrong");
    } finally {
      setIsCreatingBoard(false);
    }
  };

  return {
    boards,
    isCreateBoardOpen,
    setIsCreateBoardOpen,
    isCreatingBoard,
    createBoardError,
    createBoardForm,
    openCreateBoardModal,
    handleCreateBoardChange,
    handleCreateBoard,
  };
}
