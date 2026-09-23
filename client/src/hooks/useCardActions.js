import {
  createCard,
  deleteCard,
  deleteCardAttachment,
  updateCard,
  uploadCardAttachment,
} from "../services/boards";
import { useMutation } from "@tanstack/react-query";

const findCard = (board, id) =>
  board?.columns
    ?.flatMap((column) => column.cards || [])
    .find((card) => card._id?.toString() === id?.toString()) || null;

export default function useCardActions({
  workspaceId,
  boardId,
  setBoard,
  activeList,
  setActiveList,
  activeCard,
  setActiveCard,
  closeListMenu,
  cardState,
  assigneeState,
  modalState,
}) {
  const createCardMutation = useMutation({
    mutationFn: ({ columnId, payload }) => createCard(workspaceId, boardId, columnId, payload),
    onSuccess: (result) => setBoard(result.board),
  });
  const updateCardMutation = useMutation({
    mutationFn: ({ cardId, payload }) => updateCard(workspaceId, boardId, cardId, payload),
    onSuccess: (result) => setBoard(result.board),
  });
  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => deleteCard(workspaceId, boardId, cardId),
    onSuccess: (result) => setBoard(result.board),
  });
  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ cardId, file }) => uploadCardAttachment(workspaceId, boardId, cardId, file),
    onSuccess: (result) => setBoard(result.board),
  });
  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ cardId, attachmentId }) => deleteCardAttachment(workspaceId, boardId, cardId, attachmentId),
    onSuccess: (result) => setBoard(result.board),
  });
  const {
    cardError,
    setCardError,
    attachmentError,
    setAttachmentError,
    cardForm,
    setCardForm,
    cardDetailForm,
    setCardDetailForm,
    cardDetailInitialForm,
    setCardDetailInitialForm,
    labelDraft,
    setLabelDraft,
    isCardOpen,
    setIsCardOpen,
    isCardDetailOpen,
    setIsCardDetailOpen,
    isCardDeletingOpen,
    setIsCardDeletingOpen,
    isCreatingCard,
    setIsCreatingCard,
    isEditingCard,
    setIsEditingCard,
    isDeletingCard,
    setIsDeletingCard,
    isUploadingAttachment,
    setIsUploadingAttachment,
  } = cardState;
  const { cardAssigneeDraft, setCardAssigneeDraft, toggleCardAssigneeDraft } =
    assigneeState;
  const {
    isCardAssigneesOpen,
    setIsCardAssigneesOpen,
    isAssigneeMenuOpen,
    setIsAssigneeMenuOpen,
  } = modalState;
  const openCardModal = (column) => {
    setCardError("");
    setActiveList(column);
    setCardForm({ title: "" });
    setIsCardOpen(true);
    closeListMenu();
  };
  const openCardDetailModal = (card, column) => {
    setCardError("");
    setActiveCard(card);
    const next = {
      title: card?.title || "",
      description: card?.description || "",
      priority: card?.priority || "medium",
      dueDate: card?.dueDate
        ? new Date(card.dueDate).toISOString().slice(0, 10)
        : "",
      assignees: (card?.assignees || []).map((id) =>
        (id?._id || id?.id || id).toString(),
      ),
      labels: (card?.labels || []).map((label) => ({
        title: label.name || "",
        color: label.color || "#9fb6ff",
      })),
    };
    setCardDetailForm(next);
    setCardDetailInitialForm(next);
    setLabelDraft({ title: "", color: "#9fb6ff" });
    setIsCardDetailOpen(true);
    closeListMenu();
  };
  const handleCardChange = ({ target: { name, value } }) =>
    setCardForm((current) => ({ ...current, [name]: value }));
  const handleCardDetailChange = ({ target: { name, value } }) =>
    setCardDetailForm((current) => ({ ...current, [name]: value }));
  const handleCreateCard = async (event) => {
    event.preventDefault();
    const title = cardForm.title.trim();
    if (!title) return setCardError("Card title is required.");
    if (!activeList?._id) return setCardError("Please select a list first.");
    try {
      await createCardMutation.mutateAsync({ columnId: activeList._id, payload: { title } });
      setIsCardOpen(false);
    } catch (err) {
      setCardError(err.message || "Something went wrong");
    }
  };
  const handleCardDetailSubmit = async (event) => {
    event.preventDefault();
    const title = cardDetailForm.title.trim();
    if (!title) return setCardError("Card title is required.");
    if (!activeCard?._id) return setCardError("Please select a card first.");
    try {
      const payload = {
        ...cardDetailForm,
        title,
        dueDate: cardDetailForm.dueDate || null,
        labels: cardDetailForm.labels.map((label) => ({
          name: label.title,
          color: label.color,
        })),
      };
      const result = await updateCardMutation.mutateAsync({ cardId: activeCard._id, payload });
      setActiveCard(findCard(result.board, activeCard._id));
      setIsCardDetailOpen(false);
    } catch (err) {
      setCardError(err.message || "Something went wrong");
    }
  };
  const handleDeleteCard = () => setIsCardDeletingOpen(true);
  const confirmDeleteCard = async () => {
    if (!activeCard?._id) return;
    try {
      await deleteCardMutation.mutateAsync(activeCard._id);
      setIsCardDetailOpen(false);
      setIsCardDeletingOpen(false);
      setActiveCard(null);
    } catch (err) {
      setCardError(err.message || "Something went wrong");
    }
  };
  const handleAttachmentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeCard?._id) return;
    try {
      const result = await uploadAttachmentMutation.mutateAsync({ cardId: activeCard._id, file });
      setActiveCard(findCard(result.board, activeCard._id));
    } catch (err) {
      setAttachmentError(err.message || "Something went wrong");
    }
    event.target.value = "";
  };
  const handleDeleteAttachment = async (id) => {
    if (!activeCard?._id) return;
    try {
      const result = await deleteAttachmentMutation.mutateAsync({ cardId: activeCard._id, attachmentId: id });
      setActiveCard(findCard(result.board, activeCard._id));
    } catch (err) {
      setAttachmentError(err.message || "Something went wrong");
    }
  };
  const toggleAssignee = (id) =>
    setCardDetailForm((current) => ({
      ...current,
      assignees: current.assignees.includes(id)
        ? current.assignees.filter((entry) => entry !== id)
        : [...current.assignees, id],
    }));
  const openCardAssigneesModal = () => {
    setCardAssigneeDraft(cardDetailForm.assignees);
    setIsCardAssigneesOpen(true);
  };
  const saveCardAssignees = () => {
    setCardDetailForm((current) => ({
      ...current,
      assignees: cardAssigneeDraft,
    }));
    setIsCardAssigneesOpen(false);
  };
  const handleLabelDraftChange = ({ target: { name, value } }) =>
    setLabelDraft((current) => ({ ...current, [name]: value }));
  const addCardLabel = () => {
    const title = labelDraft.title.trim();
    if (!title) return setCardError("Label title is required.");
    setCardDetailForm((current) => ({
      ...current,
      labels: [
        ...current.labels,
        { title, color: labelDraft.color || "#9fb6ff" },
      ],
    }));
    setLabelDraft({ title: "", color: "#9fb6ff" });
  };
  const removeCardLabel = (index) =>
    setCardDetailForm((current) => ({
      ...current,
      labels: current.labels.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  return {
    cardError,
    attachmentError,
    cardForm,
    cardDetailForm,
    cardDetailInitialForm,
    labelDraft,
    isCardOpen,
    isCardDetailOpen,
    isCardAssigneesOpen,
    isCardDeletingOpen,
    isAssigneeMenuOpen,
    cardAssigneeDraft,
    isCreatingCard: createCardMutation.isPending,
    isEditingCard: updateCardMutation.isPending,
    isDeletingCard: deleteCardMutation.isPending,
    isUploadingAttachment: uploadAttachmentMutation.isPending,
    hasCardDetailChanges:
      JSON.stringify(cardDetailForm) !== JSON.stringify(cardDetailInitialForm),
    openCardModal,
    openCardDetailModal,
    handleCardChange,
    handleCardDetailChange,
    handleCreateCard,
    handleCardDetailSubmit,
    handleDeleteCard,
    confirmDeleteCard,
    handleAttachmentUpload,
    handleDeleteAttachment,
    toggleAssignee,
    openCardAssigneesModal,
    saveCardAssignees,
    toggleCardAssigneeDraft,
    handleLabelDraftChange,
    addCardLabel,
    removeCardLabel,
    setIsCardOpen,
    setIsCardDetailOpen,
    setIsCardAssigneesOpen,
    setIsCardDeletingOpen,
    setIsAssigneeMenuOpen,
    setCardDetailForm,
    setLabelDraft,
  };
}
