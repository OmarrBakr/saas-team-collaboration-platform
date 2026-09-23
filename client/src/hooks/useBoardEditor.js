import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBoard, updateBoard } from "../services/boards";
import { boardQueryKey } from "./useBoardData";

export default function useBoardEditor({
  workspaceId,
  boardId,
  board,
  setBoard,
  navigate,
}) {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeletingOpen, setIsDeletingOpen] = useState(false);
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editInitialForm, setEditInitialForm] = useState({
    name: "",
    description: "",
  });
  const updateBoardMutation = useMutation({
    mutationFn: (payload) => updateBoard(workspaceId, boardId, payload),
    onSuccess: (result) => setBoard(result.board),
  });
  const deleteBoardMutation = useMutation({
    mutationFn: () => deleteBoard(workspaceId, boardId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: boardQueryKey(workspaceId, boardId) });
      navigate(`/workspaces/${workspaceId}`);
    },
  });
  const openEditModal = () => {
    setEditError("");
    const next = {
      name: board?.name || "",
      description: board?.description || "",
    };
    setEditForm(next);
    setEditInitialForm(next);
    setIsEditOpen(true);
  };
  const handleEditChange = ({ target: { name, value } }) =>
    setEditForm((current) => ({ ...current, [name]: value }));
  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setEditError("");
    const name = editForm.name.trim();
    if (!name) return setEditError("Board name is required.");
    try {
      const result = await updateBoardMutation.mutateAsync({
        name,
        description: editForm.description.trim(),
      });
      setEditInitialForm({
        name: result.board?.name || "",
        description: result.board?.description || "",
      });
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err.message || "Something went wrong");
    }
  };
  const handleDeleteBoard = async () => {
    setDeleteError("");
    try {
      await deleteBoardMutation.mutateAsync();
      setIsDeletingOpen(false);
    } catch (err) {
      setDeleteError(err.message || "Something went wrong");
    }
  };
  return {
    isEditOpen,
    isDeletingOpen,
    isEditingBoard: updateBoardMutation.isPending,
    isDeletingBoard: deleteBoardMutation.isPending,
    editError,
    deleteError,
    editForm,
    editInitialForm,
    hasBoardEditChanges:
      editForm.name.trim() !== editInitialForm.name.trim() ||
      editForm.description.trim() !== editInitialForm.description.trim(),
    openEditModal,
    handleEditChange,
    handleEditSubmit,
    handleDeleteBoard,
    setIsEditOpen,
    setIsDeletingOpen,
  };
}
