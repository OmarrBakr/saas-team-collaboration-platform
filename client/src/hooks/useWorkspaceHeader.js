import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { workspaceQueryKey } from "./useWorkspaceData";
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
  const queryClient = useQueryClient();
  const updateWorkspaceMutation = useMutation({
    mutationFn: (payload) => updateWorkspace(workspaceId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: workspaceQueryKey(workspaceId) });
      const previousWorkspace = queryClient.getQueryData(workspaceQueryKey(workspaceId));
      queryClient.setQueryData(workspaceQueryKey(workspaceId), (current) =>
        current ? { ...current, ...payload } : current,
      );
      return { previousWorkspace };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousWorkspace) {
        queryClient.setQueryData(workspaceQueryKey(workspaceId), context.previousWorkspace);
      }
    },
    onSuccess: (result) => {
      setWorkspace(result.workspace);
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey(workspaceId) });
    },
  });
  const uploadWorkspaceLogoMutation = useMutation({
    mutationFn: (file) => uploadWorkspaceLogo(workspaceId, file),
    onSuccess: (result) => {
      setWorkspace(result.workspace);
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey(workspaceId) });
    },
  });
  const leaveWorkspaceMutation = useMutation({
    mutationFn: () => leaveWorkspace(workspaceId),
    onSuccess: () => navigate("/"),
  });
  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => deleteWorkspace(workspaceId),
    onSuccess: () => navigate("/"),
  });
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [destructiveAction, setDestructiveAction] = useState("leave");
  const [leaveError, setLeaveError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
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
    setEditError("");
    try {
      const result = await updateWorkspaceMutation.mutateAsync({
        name,
        description: editForm.description.trim(),
      });
      let updated = result.workspace;
      if (editLogoFile)
        updated = (await uploadWorkspaceLogoMutation.mutateAsync(editLogoFile))
          .workspace;
      setWorkspace(updated);
      setEditLogoFile(null);
      setEditLogoPreview(updated?.logo || "");
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err.message || "Something went wrong");
    }
  };
  const handleDestructiveAction = async () => {
    setLeaveError("");
    try {
      if (destructiveAction === "delete")
        await deleteWorkspaceMutation.mutateAsync();
      else await leaveWorkspaceMutation.mutateAsync();
      setIsLeaveOpen(false);
    } catch (err) {
      setLeaveError(err.message || "Something went wrong");
    }
  };
  return {
    navigate,
    isLeaveOpen,
    setIsLeaveOpen,
    destructiveAction,
    setDestructiveAction,
    isLeaving:
      leaveWorkspaceMutation.isPending || deleteWorkspaceMutation.isPending,
    leaveError,
    handleLeave: handleDestructiveAction,
    handleDelete: handleDestructiveAction,
    isEditOpen,
    setIsEditOpen,
    isEditingWorkspace:
      updateWorkspaceMutation.isPending || uploadWorkspaceLogoMutation.isPending,
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
