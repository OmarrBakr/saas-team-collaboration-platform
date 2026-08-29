import { useState } from "react";
import { deleteBoard, updateBoard } from "../services/boards";

export default function useBoardEditor({
  workspaceId,
  boardId,
  board,
  setBoard,
  navigate,
}) {
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
    setIsEditingBoard(true);
    try {
      const result = await updateBoard(workspaceId, boardId, {
        name,
        description: editForm.description.trim(),
      });
      setBoard(result.board);
      setEditInitialForm({
        name: result.board?.name || "",
        description: result.board?.description || "",
      });
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err.message || "Something went wrong");
    } finally {
      setIsEditingBoard(false);
    }
  };
  const handleDeleteBoard = async () => {
    setIsDeletingBoard(true);
    setDeleteError("");
    try {
      await deleteBoard(workspaceId, boardId);
      setIsDeletingOpen(false);
      navigate(`/workspaces/${workspaceId}`);
    } catch (err) {
      setDeleteError(err.message || "Something went wrong");
    } finally {
      setIsDeletingBoard(false);
    }
  };
  return {
    isEditOpen,
    isDeletingOpen,
    isEditingBoard,
    isDeletingBoard,
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
