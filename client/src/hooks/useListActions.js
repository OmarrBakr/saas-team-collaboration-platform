import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createList, deleteList, updateList } from "../services/boards";

export default function useListActions({
  workspaceId,
  boardId,
  setBoard,
  activeList,
  setActiveList,
}) {
  const createListMutation = useMutation({
    mutationFn: (payload) => createList(workspaceId, boardId, payload),
    onSuccess: (result) => setBoard(result.board),
  });
  const updateListMutation = useMutation({
    mutationFn: ({ listId, payload }) => updateList(workspaceId, boardId, listId, payload),
    onSuccess: (result) => setBoard(result.board),
  });
  const deleteListMutation = useMutation({
    mutationFn: (listId) => deleteList(workspaceId, boardId, listId),
    onSuccess: (result) => setBoard(result.board),
  });
  const [listError, setListError] = useState("");
  const [listForm, setListForm] = useState({ title: "" });
  const [listInitialForm, setListInitialForm] = useState({ title: "" });
  const [isListOpen, setIsListOpen] = useState(false);
  const [isListEditOpen, setIsListEditOpen] = useState(false);
  const [isListDeletingOpen, setIsListDeletingOpen] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isEditingList, setIsEditingList] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [listMenuOpenId, setListMenuOpenId] = useState("");
  const openListModal = () => {
    setListError("");
    setListForm({ title: "" });
    setIsListOpen(true);
  };
  const openListMenu = (id) =>
    setListMenuOpenId((current) => (current === id ? "" : id));
  const closeListMenu = () => setListMenuOpenId("");
  const openEditListModal = (column) => {
    setListError("");
    setActiveList(column);
    const title = column?.title || "";
    setListForm({ title });
    setListInitialForm({ title });
    setIsListEditOpen(true);
    closeListMenu();
  };
  const openDeleteListModal = (column) => {
    setListError("");
    setActiveList(column);
    setIsListDeletingOpen(true);
    closeListMenu();
  };
  const handleListChange = ({ target: { name, value } }) =>
    setListForm((current) => ({ ...current, [name]: value }));
  const handleCreateList = async (event) => {
    event.preventDefault();
    const title = listForm.title.trim();
    if (!title) return setListError("List name is required.");
    try {
      await createListMutation.mutateAsync({ title });
      setIsListOpen(false);
    } catch (err) {
      setListError(err.message || "Something went wrong");
    }
  };
  const handleEditList = async (event) => {
    event.preventDefault();
    const title = listForm.title.trim();
    if (!title) return setListError("List name is required.");
    if (!activeList?._id) return setListError("Please select a list first.");
    try {
      await updateListMutation.mutateAsync({ listId: activeList._id, payload: { title } });
      setListInitialForm({ title });
      setIsListEditOpen(false);
    } catch (err) {
      setListError(err.message || "Something went wrong");
    }
  };
  const handleDeleteList = async () => {
    if (!activeList?._id) return setListError("Please select a list first.");
    try {
      await deleteListMutation.mutateAsync(activeList._id);
      setIsListDeletingOpen(false);
      setActiveList(null);
    } catch (err) {
      setListError(err.message || "Something went wrong");
    }
  };
  return {
    listError,
    listForm,
    listInitialForm,
    isListOpen,
    isListEditOpen,
    isListDeletingOpen,
    isCreatingList: createListMutation.isPending,
    isEditingList: updateListMutation.isPending,
    isDeletingList: deleteListMutation.isPending,
    listMenuOpenId,
    hasListEditChanges: listForm.title.trim() !== listInitialForm.title.trim(),
    openListModal,
    openListMenu,
    closeListMenu,
    openEditListModal,
    openDeleteListModal,
    handleListChange,
    handleCreateList,
    handleEditList,
    handleDeleteList,
    setIsListOpen,
    setIsListEditOpen,
    setIsListDeletingOpen,
  };
}
