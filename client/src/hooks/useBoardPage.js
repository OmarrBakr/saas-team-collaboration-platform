import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getWorkspace } from '../services/workspaces';
import {
  createCard,
  createList,
  deleteBoard,
  deleteCard,
  deleteCardAttachment,
  deleteList,
  getBoard,
  updateBoard,
  updateCard,
  updateList,
  uploadCardAttachment,
} from '../services/boards';

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeletingOpen, setIsDeletingOpen] = useState(false);
  const [isEditingBoard, setIsEditingBoard] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [listError, setListError] = useState('');
  const [cardError, setCardError] = useState('');
  const [attachmentError, setAttachmentError] = useState('');
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [editInitialForm, setEditInitialForm] = useState({ name: '', description: '' });
  const [listForm, setListForm] = useState({ title: '' });
  const [listInitialForm, setListInitialForm] = useState({ title: '' });
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
  const [isListOpen, setIsListOpen] = useState(false);
  const [isListEditOpen, setIsListEditOpen] = useState(false);
  const [isListDeletingOpen, setIsListDeletingOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isCardDetailOpen, setIsCardDetailOpen] = useState(false);
  const [isCardDeletingOpen, setIsCardDeletingOpen] = useState(false);
  const [isCardDeleted, setIsCardDeleted] = useState(false);
  const [activeList, setActiveList] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [listMenuOpenId, setListMenuOpenId] = useState('');
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isEditingList, setIsEditingList] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);

  useEffect(() => {
    const loadBoard = async () => {
      setLoading(true);
      setError('');

      try {
        const [boardResult, workspaceResult] = await Promise.all([
          getBoard(workspaceId, boardId),
          getWorkspace(workspaceId),
        ]);

        const nextBoard = boardResult.board;
        const nextWorkspace = workspaceResult.workspace;
        setBoard(nextBoard);
        const nextMembers = nextWorkspace?.members || [];
        setWorkspaceMembers(nextMembers);

        const currentUserId = user?.id || user?._id || '';
        const currentMember = nextMembers.find((member) => {
          const memberUserId = member.user?._id || member.user?.id || member.user;
          return memberUserId?.toString?.() === currentUserId?.toString?.();
        });
        setIsAdmin(currentMember?.role === 'admin');

        const nextName = nextBoard?.name || '';
        const nextDescription = nextBoard?.description || '';
        setEditForm({ name: nextName, description: nextDescription });
        setEditInitialForm({ name: nextName, description: nextDescription });
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
  }, [workspaceId, boardId, user?.id, user?._id]);

  const hasBoardEditChanges =
    editForm.name.trim() !== editInitialForm.name.trim() ||
    editForm.description.trim() !== editInitialForm.description.trim();

  const hasListEditChanges = listForm.title.trim() !== listInitialForm.title.trim();

  const openEditModal = () => {
    setEditError('');
    setEditForm({
      name: board?.name || '',
      description: board?.description || '',
    });
    setEditInitialForm({
      name: board?.name || '',
      description: board?.description || '',
    });
    setIsEditOpen(true);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setEditError('');

    const trimmedName = editForm.name.trim();
    const trimmedDescription = editForm.description.trim();

    if (!trimmedName) {
      setEditError('Board name is required.');
      return;
    }

    setIsEditingBoard(true);

    try {
      const result = await updateBoard(workspaceId, boardId, {
        name: trimmedName,
        description: trimmedDescription,
      });

      setBoard(result.board);
      setEditInitialForm({
        name: result.board?.name || '',
        description: result.board?.description || '',
      });
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err.message || 'Something went wrong');
    } finally {
      setIsEditingBoard(false);
    }
  };

  const handleDeleteBoard = async () => {
    setIsDeletingBoard(true);
    setDeleteError('');

    try {
      await deleteBoard(workspaceId, boardId);
      setIsDeletingOpen(false);
      navigate(`/workspaces/${workspaceId}`);
    } catch (err) {
      setDeleteError(err.message || 'Something went wrong');
    } finally {
      setIsDeletingBoard(false);
    }
  };

  const openListModal = () => {
    setListError('');
    setListForm({ title: '' });
    setIsListOpen(true);
  };

  const openListMenu = (columnId) => {
    setListMenuOpenId((current) => (current === columnId ? '' : columnId));
  };

  const closeListMenu = () => {
    setListMenuOpenId('');
  };

  const openEditListModal = (column) => {
    setListError('');
    setActiveList(column);
    const nextTitle = column?.title || '';
    setListForm({ title: nextTitle });
    setListInitialForm({ title: nextTitle });
    setIsListEditOpen(true);
    closeListMenu();
  };

  const openDeleteListModal = (column) => {
    setListError('');
    setActiveList(column);
    setIsListDeletingOpen(true);
    closeListMenu();
  };

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

  const handleCreateList = async (event) => {
    event.preventDefault();
    setListError('');

    const title = listForm.title.trim();
    if (!title) {
      setListError('List name is required.');
      return;
    }

    setIsCreatingList(true);

    try {
      const result = await createList(workspaceId, boardId, { title });
      setBoard(result.board);
      setIsListOpen(false);
    } catch (err) {
      setListError(err.message || 'Something went wrong');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleEditList = async (event) => {
    event.preventDefault();
    setListError('');

    const title = listForm.title.trim();
    if (!title) {
      setListError('List name is required.');
      return;
    }

    if (!activeList?._id) {
      setListError('Please select a list first.');
      return;
    }

    setIsEditingList(true);

    try {
      const result = await updateList(workspaceId, boardId, activeList._id, { title });
      setBoard(result.board);
      setListInitialForm({ title });
      setIsListEditOpen(false);
    } catch (err) {
      setListError(err.message || 'Something went wrong');
    } finally {
      setIsEditingList(false);
    }
  };

  const handleDeleteList = async () => {
    if (!activeList?._id) {
      setListError('Please select a list first.');
      return;
    }

    setIsDeletingList(true);
    setListError('');

    try {
      const result = await deleteList(workspaceId, boardId, activeList._id);
      setBoard(result.board);
      setIsListDeletingOpen(false);
      setActiveList(null);
    } catch (err) {
      setListError(err.message || 'Something went wrong');
    } finally {
      setIsDeletingList(false);
    }
  };

  const handleCreateCard = async (event) => {
    event.preventDefault();
    setCardError('');

    const title = cardForm.title.trim();
    if (!title) {
      setCardError('Card title is required.');
      return;
    }

    if (!activeList?._id) {
      setCardError('Please select a list first.');
      return;
    }

    setIsCreatingCard(true);

    try {
      const result = await createCard(workspaceId, boardId, activeList._id, { title });
      setBoard(result.board);
      setIsCardOpen(false);
    } catch (err) {
      setCardError(err.message || 'Something went wrong');
    } finally {
      setIsCreatingCard(false);
    }
  };

  const handleCardDetailSubmit = async (event) => {
    event.preventDefault();
    setCardError('');
    setAttachmentError('');

    const trimmedTitle = cardDetailForm.title.trim();
    if (!trimmedTitle) {
      setCardError('Card title is required.');
      return;
    }

    if (!activeCard?._id) {
      setCardError('Please select a card first.');
      return;
    }

    setIsEditingCard(true);

    try {
      const payload = {
        title: trimmedTitle,
        description: cardDetailForm.description,
        priority: cardDetailForm.priority,
        dueDate: cardDetailForm.dueDate || null,
        assignees: cardDetailForm.assignees,
        labels: cardDetailForm.labels.map((label) => ({
          name: label.title,
          color: label.color,
        })),
      };

      const result = await updateCard(workspaceId, boardId, activeCard._id, payload);
      setBoard(result.board);
      setActiveCard(findCardById(result.board, activeCard._id));
      setIsCardDetailOpen(false);
    } catch (err) {
      setCardError(err.message || 'Something went wrong');
    } finally {
      setIsEditingCard(false);
    }
  };

  const handleDeleteCard = async () => {
    setIsCardDeletingOpen(true);
  };

  const confirmDeleteCard = async () => {
    if (!activeCard?._id) return;

    setIsDeletingCard(true);
    setCardError('');

    try {
      const result = await deleteCard(workspaceId, boardId, activeCard._id);
      setBoard(result.board);
      setIsCardDetailOpen(false);
      setIsCardDeletingOpen(false);
      setActiveCard(null);
    } catch (err) {
      setCardError(err.message || 'Something went wrong');
    } finally {
      setIsDeletingCard(false);
    }
  };

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
    user,
    board,
    loading,
    error,
    isAdmin,
    workspaceMembers,
    isEditOpen,
    isDeletingOpen,
    isEditingBoard,
    isDeletingBoard,
    editError,
    deleteError,
    listError,
    cardError,
    attachmentError,
    editForm,
    listForm,
    listInitialForm,
    cardForm,
    cardDetailForm,
    labelDraft,
    isListOpen,
    isListEditOpen,
    isListDeletingOpen,
    isCardOpen,
    isCardDetailOpen,
    isCardDeletingOpen,
    isAssigneeMenuOpen,
    activeList,
    activeCard,
    listMenuOpenId,
    isCreatingList,
    isEditingList,
    isDeletingList,
    isCreatingCard,
    isEditingCard,
    isDeletingCard,
    isUploadingAttachment,
    hasBoardEditChanges,
    hasListEditChanges,
    hasCardDetailChanges,
    openEditModal,
    handleEditChange,
    handleEditSubmit,
    handleDeleteBoard,
    openListModal,
    openListMenu,
    closeListMenu,
    openEditListModal,
    openDeleteListModal,
    openCardModal,
    openCardDetailModal,
    handleListChange,
    handleCardChange,
    handleCardDetailChange,
    closeAssigneeMenu,
    setIsAssigneeMenuOpen,
    toggleAssignee,
    handleLabelDraftChange,
    addCardLabel,
    removeCardLabel,
    handleCreateList,
    handleEditList,
    handleDeleteList,
    handleCreateCard,
    handleCardDetailSubmit,
    handleDeleteCard,
    confirmDeleteCard,
    handleAttachmentUpload,
    handleDeleteAttachment,
    setIsEditOpen,
    setIsDeletingOpen,
    setIsListOpen,
    setIsListEditOpen,
    setIsListDeletingOpen,
    setIsCardOpen,
    setIsCardDetailOpen,
    setIsCardDeletingOpen,
    setIsAssigneeMenuOpen,
  };
}
