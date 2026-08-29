import { useState } from "react";
import { createList, deleteList, updateList } from "../services/boards";

export default function useListActions({
  workspaceId,
  boardId,
  setBoard,
  activeList,
  setActiveList,
}) {
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
    setIsCreatingList(true);
    try {
      const result = await createList(workspaceId, boardId, { title });
      setBoard(result.board);
      setIsListOpen(false);
    } catch (err) {
      setListError(err.message || "Something went wrong");
    } finally {
      setIsCreatingList(false);
    }
  };
  const handleEditList = async (event) => {
    event.preventDefault();
    const title = listForm.title.trim();
    if (!title) return setListError("List name is required.");
    if (!activeList?._id) return setListError("Please select a list first.");
    setIsEditingList(true);
    try {
      const result = await updateList(workspaceId, boardId, activeList._id, {
        title,
      });
      setBoard(result.board);
      setListInitialForm({ title });
      setIsListEditOpen(false);
    } catch (err) {
      setListError(err.message || "Something went wrong");
    } finally {
      setIsEditingList(false);
    }
  };
  const handleDeleteList = async () => {
    if (!activeList?._id) return setListError("Please select a list first.");
    setIsDeletingList(true);
    try {
      const result = await deleteList(workspaceId, boardId, activeList._id);
      setBoard(result.board);
      setIsListDeletingOpen(false);
      setActiveList(null);
    } catch (err) {
      setListError(err.message || "Something went wrong");
    } finally {
      setIsDeletingList(false);
    }
  };
  return {
    listError,
    listForm,
    listInitialForm,
    isListOpen,
    isListEditOpen,
    isListDeletingOpen,
    isCreatingList,
    isEditingList,
    isDeletingList,
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
