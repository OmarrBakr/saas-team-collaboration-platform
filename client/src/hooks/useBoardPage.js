import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import {
  createCard,
  createList,
  deleteBoard,
  deleteCard,
  deleteCardAttachment,
  deleteList,
  moveList,
  moveCard,
  updateBoard,
  updateCard,
  updateList,
  uploadCardAttachment,
} from '../services/boards';
import useBoardData from './useBoardData';
import useBoardEditor from './useBoardEditor';
import useBoardRealtime from './useBoardRealtime';
import useCardAssignees from './useCardAssignees';
import useCardActions from './useCardActions';
import useBoardDragAndDrop from './useBoardDragAndDrop';
import useListActions from './useListActions';

const toDateInputValue = (value) => {
  if (!value) return '';
  return new Date(value).toISOString().split('T')[0];
};

const findCardById = (board, cardId) => {
  for (const column of board?.columns || []) {
    const card = column.cards?.find((entry) => entry._id?.toString?.() === cardId?.toString?.());
    if (card) return card;
  }
  return null;
};

export default function useBoardPage(workspaceId, boardId) {
  const {
    user,
    presenceByBoard,
    joinBoardPresence,
    leaveBoardPresence,
    updateBoardPresence,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !boardId) return undefined;

    joinBoardPresence(boardId, ({ boardId: joinedBoardId, userIds }) => {
      updateBoardPresence(joinedBoardId, userIds);
    });
    return () => leaveBoardPresence(boardId);
  }, [user, boardId, joinBoardPresence, leaveBoardPresence, updateBoardPresence]);

  const { board, setBoard, loading, error, setError, workspaceMembers, isAdmin } = useBoardData(workspaceId, boardId);
  const dragAndDrop = useBoardDragAndDrop({ board, setBoard, isAdmin, workspaceId, boardId, setError });
  useBoardRealtime({ user, boardId, workspaceId, navigate, setBoard });
  const { cardAssigneeDraft, setCardAssigneeDraft, toggleCardAssigneeDraft } = useCardAssignees();
  const boardEditor = useBoardEditor({ workspaceId, boardId, board, setBoard, navigate });

  const [cardError, setCardError] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const [cardForm, setCardForm] = useState({ title: '' });
  const [cardDetailForm, setCardDetailForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignees: [],
    labels: [],
  });
  const [cardDetailInitialForm, setCardDetailInitialForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignees: [],
    labels: [],
  });
  const [labelDraft, setLabelDraft] = useState({ title: '', color: '#9fb6ff' });
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isCardDetailOpen, setIsCardDetailOpen] = useState(false);
  const [isCardAssigneesOpen, setIsCardAssigneesOpen] = useState(false);
  const [isCardDeletingOpen, setIsCardDeletingOpen] = useState(false);
  const [isBoardViewersOpen, setIsBoardViewersOpen] = useState(false);
  const [isCardDeleted, setIsCardDeleted] = useState(false);
  const [activeList, setActiveList] = useState(null);
  const listActions = useListActions({ workspaceId, boardId, setBoard, activeList, setActiveList });
  const closeListMenu = listActions.closeListMenu;
  const [activeCard, setActiveCard] = useState(null);
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const cardActions = useCardActions({
    workspaceId, boardId, setBoard, activeList, setActiveList, activeCard, setActiveCard,
    closeListMenu: listActions.closeListMenu,
    cardState: { cardError, setCardError, attachmentError, setAttachmentError, cardForm, setCardForm, cardDetailForm, setCardDetailForm, cardDetailInitialForm, setCardDetailInitialForm, labelDraft, setLabelDraft, isCardOpen, setIsCardOpen, isCardDetailOpen, setIsCardDetailOpen, isCardDeletingOpen, setIsCardDeletingOpen, isCreatingCard, setIsCreatingCard, isEditingCard, setIsEditingCard, isDeletingCard, setIsDeletingCard, isUploadingAttachment, setIsUploadingAttachment },
    assigneeState: { cardAssigneeDraft, setCardAssigneeDraft, toggleCardAssigneeDraft },
    modalState: { isCardAssigneesOpen, setIsCardAssigneesOpen, isAssigneeMenuOpen, setIsAssigneeMenuOpen },
  });

  const openCardModal = (column) => {
    setCardError('');
    setActiveList(column);
    setCardForm({ title: '' });
    setIsCardOpen(true);
    closeListMenu();
  };

  const openCardDetailModal = (card, column) => {
    setCardError('');
    setAttachmentError('');
    setActiveList(column);
    setActiveCard(card);
    const nextCardDetailForm = {
      title: card?.title || '',
      description: card?.description || '',
      priority: card?.priority || 'medium',
      dueDate: toDateInputValue(card?.dueDate),
      assignees: (card?.assignees || [])
        .map((assignee) => assignee?._id || assignee?.id || assignee)
        .map((id) => id?.toString?.())
        .filter(Boolean),
      labels: (card?.labels || []).map((label) => ({
        title: label.name || '',
        color: label.color || '#9fb6ff',
      })),
    };
    setCardDetailForm(nextCardDetailForm);
    setCardDetailInitialForm(nextCardDetailForm);
    setCardAssigneeDraft(nextCardDetailForm.assignees);
    setLabelDraft({ title: '', color: '#9fb6ff' });
    setIsCardDetailOpen(true);
    setIsAssigneeMenuOpen(false);
    closeListMenu();
  };

  const handleListChange = (event) => {
    const { name, value } = event.target;
    setListForm((current) => ({ ...current, [name]: value }));
  };

  const handleCardChange = (event) => {
    const { name, value } = event.target;
    setCardForm((current) => ({ ...current, [name]: value }));
  };

  const handleCardDetailChange = (event) => {
    const { name, value } = event.target;

    setCardDetailForm((current) => ({ ...current, [name]: value }));
  };

  const toggleAssignee = (memberId) => {
    setCardDetailForm((current) => {
      const exists = current.assignees.includes(memberId);
      return {
        ...current,
        assignees: exists
          ? current.assignees.filter((id) => id !== memberId)
          : [...current.assignees, memberId],
      };
    });
  };

  const closeAssigneeMenu = () => {
    setIsAssigneeMenuOpen(false);
  };

  const openCardAssigneesModal = () => {
    setCardAssigneeDraft(cardDetailForm.assignees);
    setCardError('');
    setIsCardAssigneesOpen(true);
  };

  const closeCardAssigneesModal = () => {
    setIsCardAssigneesOpen(false);
  };


  const saveCardAssignees = () => {
    setCardDetailForm((current) => ({
      ...current,
      assignees: cardAssigneeDraft,
    }));
    setIsCardAssigneesOpen(false);
  };

  const handleLabelDraftChange = (event) => {
    const { name, value } = event.target;
    setLabelDraft((current) => ({ ...current, [name]: value }));
  };

  const addCardLabel = () => {
    const title = labelDraft.title.trim();
    if (!title) {
      setCardError('Label title is required.');
      return;
    }

    setCardDetailForm((current) => ({
      ...current,
      labels: [...current.labels, { title, color: labelDraft.color || '#9fb6ff' }],
    }));
    setLabelDraft({ title: '', color: '#9fb6ff' });
    setCardError('');
  };

  const removeCardLabel = (index) => {
    setCardDetailForm((current) => ({
      ...current,
      labels: current.labels.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const hasCardDetailChanges =
    cardDetailForm.title.trim() !== cardDetailInitialForm.title.trim() ||
    cardDetailForm.description.trim() !== cardDetailInitialForm.description.trim() ||
    cardDetailForm.priority !== cardDetailInitialForm.priority ||
    cardDetailForm.dueDate !== cardDetailInitialForm.dueDate ||
    cardDetailForm.assignees.join(',') !== cardDetailInitialForm.assignees.join(',') ||
    JSON.stringify(cardDetailForm.labels) !== JSON.stringify(cardDetailInitialForm.labels);


  const handleAttachmentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeCard?._id) return;

    setIsUploadingAttachment(true);
    setAttachmentError('');

    try {
      const result = await uploadCardAttachment(workspaceId, boardId, activeCard._id, file);
      setBoard(result.board);
      setActiveCard(findCardById(result.board, activeCard._id));
    } catch (err) {
      setAttachmentError(err.message || 'Something went wrong');
    } finally {
      setIsUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!activeCard?._id) return;

    setAttachmentError('');

    try {
      const result = await deleteCardAttachment(workspaceId, boardId, activeCard._id, attachmentId);
      setBoard(result.board);
      setActiveCard(findCardById(result.board, activeCard._id));
    } catch (err) {
      setAttachmentError(err.message || 'Something went wrong');
    }
  };

  return {
    ...boardEditor,
    user,
    board,
    loading,
    error,
    isAdmin,
    workspaceMembers,
    onlineBoardMemberIds: presenceByBoard[boardId] || [],
    cardError,
    attachmentError,
    cardForm,
    cardDetailForm,
    labelDraft,
    isCardOpen,
    isCardDetailOpen,
    isCardAssigneesOpen,
    isCardDeletingOpen,
    isBoardViewersOpen,
    isAssigneeMenuOpen,
    cardAssigneeDraft,
    activeList,
    activeCard,
    isCreatingCard,
    isEditingCard,
    isDeletingCard,
    isUploadingAttachment,
    hasCardDetailChanges,
    setIsCardOpen,
    setIsCardDetailOpen,
    setIsCardDeletingOpen,
    setIsBoardViewersOpen,
    setIsAssigneeMenuOpen,
    ...listActions,
    ...cardActions,
    ...dragAndDrop,
  };
}
