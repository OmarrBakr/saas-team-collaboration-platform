import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteWorkspace,
  leaveWorkspace,
  updateWorkspace,
  uploadWorkspaceLogo,
} from "../services/workspaces";

export default function useWorkspaceHeader({
  workspaceId,
  workspace,
  setWorkspace,
}) {
  const navigate = useNavigate();
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [destructiveAction, setDestructiveAction] = useState("leave");
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState("");
  const [editInitialForm, setEditInitialForm] = useState({
    name: "",
    description: "",
    logo: "",
  });

  const openEditModal = () => {
    const next = {
      name: workspace?.name || "",
      description: workspace?.description || "",
      logo: workspace?.logo || "",
    };
    setEditForm({ name: next.name, description: next.description });
    setEditLogoPreview(next.logo);
    setEditLogoFile(null);
    setEditInitialForm(next);
    setEditError("");
    setIsEditOpen(true);
  };
  const handleEditChange = ({ target: { name, value } }) =>
    setEditForm((current) => ({ ...current, [name]: value }));
  const handleEditLogoChange = (event) => {
    const file = event.target.files?.[0] || null;
    setEditLogoFile(file);
    setEditLogoPreview(
      file ? URL.createObjectURL(file) : workspace?.logo || "",
    );
  };
  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const name = editForm.name.trim();
    if (!name) return setEditError("Workspace name is required.");
    setIsEditingWorkspace(true);
    setEditError("");
    try {
      const result = await updateWorkspace(workspaceId, {
        name,
        description: editForm.description.trim(),
      });
      let updated = result.workspace;
      if (editLogoFile)
        updated = (await uploadWorkspaceLogo(workspaceId, editLogoFile))
          .workspace;
      setWorkspace(updated);
      setEditLogoFile(null);
      setEditLogoPreview(updated?.logo || "");
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err.message || "Something went wrong");
    } finally {
      setIsEditingWorkspace(false);
    }
  };
  const handleDestructiveAction = async () => {
    setIsLeaving(true);
    setLeaveError("");
    try {
      if (destructiveAction === "delete") await deleteWorkspace(workspaceId);
      else await leaveWorkspace(workspaceId);
      setIsLeaveOpen(false);
      navigate("/");
    } catch (err) {
      setLeaveError(err.message || "Something went wrong");
    } finally {
      setIsLeaving(false);
    }
  };
  return {
    navigate,
    isLeaveOpen,
    setIsLeaveOpen,
    destructiveAction,
    setDestructiveAction,
    isLeaving,
    leaveError,
    handleLeave: handleDestructiveAction,
    handleDelete: handleDestructiveAction,
    isEditOpen,
    setIsEditOpen,
    isEditingWorkspace,
    editError,
    editForm,
    editLogoFile,
    editLogoPreview,
    editInitialForm,
    openEditModal,
    handleEditChange,
    handleEditLogoChange,
    handleEditSubmit,
    hasWorkspaceEditChanges:
      editForm.name.trim() !== editInitialForm.name.trim() ||
      editForm.description.trim() !== editInitialForm.description.trim() ||
      Boolean(editLogoFile) ||
      editLogoPreview !== (editInitialForm.logo || ""),
  };
}
