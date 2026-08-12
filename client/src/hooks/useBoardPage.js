import { useEffect, useRef, useState } from 'react';
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
  moveList,
  moveCard,
  updateBoard,
  updateCard,
  updateList,
  uploadCardAttachment,
} from '../services/boards';
import { subscribeToBoardUpdates } from '../services/socket';

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

const reorderColumns = (columns, fromIndex, toIndex) => {
  const nextColumns = [...columns];
  const [movedColumn] = nextColumns.splice(fromIndex, 1);
  nextColumns.splice(toIndex, 0, movedColumn);
  return nextColumns.map((column, index) => ({
    ...column,
    position: index,
  }));
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

  useEffect(() => {
    if (!user || !boardId) return undefined;

    return subscribeToBoardUpdates(boardId, (eventName, payload) => {
      if (eventName === 'board:updated' && payload.deleted) {
        navigate(`/workspaces/${workspaceId}`);
        return;
      }

      if (payload.board) setBoard(payload.board);
    });
  }, [user, boardId, workspaceId, navigate]);

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
  const [isCardAssigneesOpen, setIsCardAssigneesOpen] = useState(false);
  const [isCardDeletingOpen, setIsCardDeletingOpen] = useState(false);
  const [isBoardViewersOpen, setIsBoardViewersOpen] = useState(false);
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
  const [cardAssigneeDraft, setCardAssigneeDraft] = useState([]);
  const [draggedColumnId, setDraggedColumnId] = useState('');
  const [dragOverColumnId, setDragOverColumnId] = useState('');
  const [draggedCardId, setDraggedCardId] = useState('');
  const [dragOverCardId, setDragOverCardId] = useState('');
  const dragPointerIdRef = useRef(null);
  const dragColumnElementRef = useRef(null);
  const dragTouchIdRef = useRef(null);
  const dragCardTouchIdRef = useRef(null);
  const suppressCardClickRef = useRef(false);
  const cardPointerStartRef = useRef(null);
  const cardLongPressTimerRef = useRef(null);
  const cardLongPressStateRef = useRef({ columnId: '', cardId: '', touchId: null });

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

  const finishColumnDrag = async () => {
    const draggedId = dragPointerIdRef.current?.draggedColumnId;
    const targetId = dragPointerIdRef.current?.dragOverColumnId;

    dragPointerIdRef.current = null;
    dragColumnElementRef.current = null;

    if (!board?.columns?.length || !draggedId || !targetId) {
      setDraggedColumnId('');
      setDragOverColumnId('');
      return;
    }

    const columns = board.columns || [];
    const fromIndex = columns.findIndex((column) => column._id?.toString() === draggedId.toString());
    const toIndex = columns.findIndex((column) => column._id?.toString() === targetId.toString());

    setDraggedColumnId('');
    setDragOverColumnId('');

    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return;
    }

    setBoard((current) => {
      if (!current?.columns?.length) return current;
      return {
        ...current,
        columns: reorderColumns(current.columns, fromIndex, toIndex),
      };
    });

    try {
      const result = await moveList(workspaceId, boardId, draggedId, { toPosition: toIndex });
      setBoard(result.board);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setBoard((current) => {
        if (!current?.columns?.length) return current;
        return {
          ...current,
          columns: reorderColumns(current.columns, toIndex, fromIndex),
        };
      });
    }
  };

  const updateDragTargetFromPoint = (clientX, clientY) => {
    const element = document.elementFromPoint(clientX, clientY);
    const columnElement = element?.closest?.('[data-column-id]');
    const columnId = columnElement?.dataset?.columnId || '';

    if (columnId) {
      setDragOverColumnId(columnId);
      dragPointerIdRef.current = {
        ...(dragPointerIdRef.current || {}),
        dragOverColumnId: columnId,
      };
    }
  };

  const handleColumnDragStart = (columnId, event) => {
    if (!isAdmin) return;

    event.preventDefault();
    dragPointerIdRef.current = {
      pointerId: event.pointerId,
      draggedColumnId: columnId,
      dragOverColumnId: columnId,
    };
    dragColumnElementRef.current = event.currentTarget;
    setDraggedColumnId(columnId);
    setDragOverColumnId(columnId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleColumnDragMove = (event) => {
    if (!dragPointerIdRef.current || event.pointerId !== dragPointerIdRef.current.pointerId) return;
    event.preventDefault();
    updateDragTargetFromPoint(event.clientX, event.clientY);
  };

  const handleColumnDragEnd = async (event) => {
    if (dragPointerIdRef.current && event?.pointerId !== dragPointerIdRef.current.pointerId) return;
    await finishColumnDrag();
  };

  const handleCardDragStart = (columnId, cardId, event) => {
    if (!isAdmin) return;

    event.preventDefault();
    dragPointerIdRef.current = {
      pointerId: event.pointerId,
      draggedCard: { columnId, cardId },
      dragOverCard: { columnId, cardId },
    };
    setDraggedCardId(cardId);
    setDragOverCardId(cardId);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleCardPointerDown = (columnId, cardId, event) => {
    if (!isAdmin) return;

    cardPointerStartRef.current = {
      pointerId: event.pointerId,
      columnId,
      cardId,
      startX: event.clientX,
      startY: event.clientY,
      target: event.currentTarget,
    };
  };

  const handleCardPointerMove = (event) => {
    const start = cardPointerStartRef.current;
    if (start && !dragPointerIdRef.current?.draggedCard && event.pointerId === start.pointerId) {
      const distance = Math.hypot(event.clientX - start.startX, event.clientY - start.startY);
      if (distance >= 8) {
        dragPointerIdRef.current = {
          pointerId: start.pointerId,
          draggedCard: { columnId: start.columnId, cardId: start.cardId },
          dragOverCard: { columnId: start.columnId, cardId: start.cardId },
        };
        suppressCardClickRef.current = true;
        setDraggedCardId(start.cardId);
        setDragOverCardId(start.cardId);
        start.target?.setPointerCapture?.(start.pointerId);
      } else {
        return;
      }
    }

    if (!dragPointerIdRef.current?.draggedCard || event.pointerId !== dragPointerIdRef.current.pointerId) {
      return;
    }

    event.preventDefault();

    const element = document.elementFromPoint(event.clientX, event.clientY);
    const cardElement = element?.closest?.('[data-card-id]');
    const columnElement = element?.closest?.('[data-column-id]');
    const cardId = cardElement?.dataset?.cardId || '';
    const columnId = cardElement?.dataset?.columnId || columnElement?.dataset?.columnId || '';

    if (cardId && columnId) {
      setDragOverCardId(cardId);
      dragPointerIdRef.current = {
        ...dragPointerIdRef.current,
        dragOverCard: { columnId, cardId },
      };
    }
  };

  const handleCardPointerUp = async (event) => {
    const start = cardPointerStartRef.current;
    cardPointerStartRef.current = null;

    if (dragPointerIdRef.current && event?.pointerId !== dragPointerIdRef.current.pointerId) return;
    if (dragPointerIdRef.current?.draggedCard) {
      await finishCardDrag();
      return;
    }

    if (start && event?.pointerId === start.pointerId) {
      suppressCardClickRef.current = false;
    }
  };

  const handleCardPointerCancel = async (event) => {
    cardPointerStartRef.current = null;
    if (dragPointerIdRef.current && event?.pointerId !== dragPointerIdRef.current.pointerId) return;
    dragPointerIdRef.current = null;
    dragCardTouchIdRef.current = null;
    suppressCardClickRef.current = false;
    setDraggedCardId('');
    setDragOverCardId('');
  };

  const handleCardDragMove = (event) => {
    if (!dragPointerIdRef.current?.draggedCard || event.pointerId !== dragPointerIdRef.current.pointerId) return;
    event.preventDefault();

    const element = document.elementFromPoint(event.clientX, event.clientY);
    const cardElement = element?.closest?.('[data-card-id]');
    const columnElement = element?.closest?.('[data-column-id]');
    const cardId = cardElement?.dataset?.cardId || '';
    const columnId = cardElement?.dataset?.columnId || columnElement?.dataset?.columnId || '';

    if (cardId && columnId) {
      setDragOverCardId(cardId);
      dragPointerIdRef.current = {
        ...dragPointerIdRef.current,
        dragOverCard: { columnId, cardId },
      };
    }
  };

  const handleCardDragEnd = async (event) => {
    if (dragPointerIdRef.current && event?.pointerId !== dragPointerIdRef.current.pointerId) return;
    await finishCardDrag();
  };

  const handleCardTouchStart = (columnId, cardId, event) => {
    if (!isAdmin) return;

    const touch = event.touches?.[0];
    if (!touch) return;

    clearTimeout(cardLongPressTimerRef.current);
    cardLongPressStateRef.current = { columnId, cardId, touchId: touch.identifier };
    cardLongPressTimerRef.current = window.setTimeout(() => {
      const state = cardLongPressStateRef.current;
      if (state.columnId !== columnId || state.cardId !== cardId || state.touchId !== touch.identifier) {
        return;
      }

      dragTouchIdRef.current = touch.identifier;
      dragCardTouchIdRef.current = touch.identifier;
      dragPointerIdRef.current = {
        pointerId: touch.identifier,
        draggedCard: { columnId, cardId },
        dragOverCard: { columnId, cardId },
      };
      suppressCardClickRef.current = true;
      setDraggedCardId(cardId);
      setDragOverCardId(cardId);
      event.currentTarget.setPointerCapture?.(touch.identifier);
    }, 250);
  };

  const getTouchPoint = (touches, touchId) => {
    for (const touch of touches) {
      if (touch.identifier === touchId) {
        return touch;
      }
    }

    return null;
  };

  const handleColumnTouchStart = (columnId, event) => {
    if (!isAdmin) return;

    const touch = event.touches?.[0];
    if (!touch) return;

    event.preventDefault();
    dragTouchIdRef.current = touch.identifier;
    dragPointerIdRef.current = {
      draggedColumnId: columnId,
      dragOverColumnId: columnId,
    };
    dragColumnElementRef.current = event.currentTarget;
    setDraggedColumnId(columnId);
    setDragOverColumnId(columnId);
  };

  const finishCardDrag = async () => {
    const dragged = dragPointerIdRef.current?.draggedCard;
    const target = dragPointerIdRef.current?.dragOverCard;

    dragPointerIdRef.current = null;
    dragCardTouchIdRef.current = null;

    if (!dragged || !target) {
      setDraggedCardId('');
      setDragOverCardId('');
      return;
    }

    const fromColumnIndex = board?.columns?.findIndex(
      (column) => column._id?.toString() === dragged.columnId?.toString()
    );
    const toColumnIndex = board?.columns?.findIndex(
      (column) => column._id?.toString() === target.columnId?.toString()
    );

    if (fromColumnIndex < 0 || toColumnIndex < 0) {
      setDraggedCardId('');
      setDragOverCardId('');
      return;
    }

    const fromColumn = board.columns[fromColumnIndex];
    const toColumn = board.columns[toColumnIndex];
    const fromIndex = fromColumn.cards.findIndex((card) => card._id?.toString() === dragged.cardId.toString());
    let toIndex = toColumn.cards.findIndex((card) => card._id?.toString() === target.cardId.toString());

    setDraggedCardId('');
    setDragOverCardId('');

    if (fromIndex < 0) return;
    if (toIndex < 0) toIndex = toColumn.cards.length;
    if (fromColumn._id?.toString() === toColumn._id?.toString() && fromIndex === toIndex) {
      return;
    }

    setBoard((current) => {
      if (!current?.columns?.length) return current;

      const nextColumns = current.columns.map((column) => ({
        ...column,
        cards: column.cards ? [...column.cards] : [],
      }));
      const nextFromColumn = nextColumns.find((column) => column._id?.toString() === dragged.columnId?.toString());
      const nextToColumn = nextColumns.find((column) => column._id?.toString() === target.columnId?.toString());

      if (!nextFromColumn || !nextToColumn) return current;

      const [movedCard] = nextFromColumn.cards.splice(fromIndex, 1);
      nextToColumn.cards.splice(toIndex, 0, movedCard);

      return {
        ...current,
        columns: nextColumns,
      };
    });

    try {
      const result = await moveCard(
        workspaceId,
        boardId,
        dragged.cardId,
        dragged.columnId,
        target.columnId,
        { position: toIndex }
      );
      setBoard(result.board);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  };

  const handleWindowTouchMove = (event) => {
    const start = cardPointerStartRef.current;
    const touch = dragTouchIdRef.current !== null ? getTouchPoint(event.touches, dragTouchIdRef.current) : null;
    const activeTouch = touch || getTouchPoint(event.touches, start?.pointerId);
    if (dragTouchIdRef.current === null && !start) return;

    if (!activeTouch) return;

    event.preventDefault();
    if (start && !dragPointerIdRef.current?.draggedCard) {
      const distance = Math.hypot(activeTouch.clientX - start.startX, activeTouch.clientY - start.startY);
      if (distance >= 8) {
        dragTouchIdRef.current = activeTouch.identifier;
        dragCardTouchIdRef.current = activeTouch.identifier;
        dragPointerIdRef.current = {
          pointerId: activeTouch.identifier,
          draggedCard: { columnId: start.columnId, cardId: start.cardId },
          dragOverCard: { columnId: start.columnId, cardId: start.cardId },
        };
        suppressCardClickRef.current = true;
        setDraggedCardId(start.cardId);
        setDragOverCardId(start.cardId);
        start.target?.setPointerCapture?.(activeTouch.identifier);
      } else {
        return;
      }
    }

    if (dragPointerIdRef.current.draggedCard) {
      const element = document.elementFromPoint(activeTouch.clientX, activeTouch.clientY);
      const cardElement = element?.closest?.('[data-card-id]');
      const columnElement = element?.closest?.('[data-column-id]');
      const cardId = cardElement?.dataset?.cardId || '';
      const columnId = cardElement?.dataset?.columnId || columnElement?.dataset?.columnId || '';
      if (cardId && columnId) {
        setDragOverCardId(cardId);
        dragPointerIdRef.current = {
          ...dragPointerIdRef.current,
          dragOverCard: { columnId, cardId },
        };
      }
      return;
    }
    updateDragTargetFromPoint(touch.clientX, touch.clientY);
  };

  const handleWindowTouchEnd = async (event) => {
    clearTimeout(cardLongPressTimerRef.current);
    cardLongPressTimerRef.current = null;
    if (dragTouchIdRef.current === null) return;

    const touch = getTouchPoint(event.changedTouches, dragTouchIdRef.current);
    if (!touch) return;

    event.preventDefault();
    dragTouchIdRef.current = null;
    if (dragPointerIdRef.current?.draggedCard) {
      await finishCardDrag();
      return;
    }
    cardPointerStartRef.current = null;
    await finishColumnDrag();
  };

  const handleWindowTouchCancel = () => {
    clearTimeout(cardLongPressTimerRef.current);
    cardLongPressTimerRef.current = null;
    cardPointerStartRef.current = null;
    cardLongPressStateRef.current = { columnId: '', cardId: '', touchId: null };
    dragTouchIdRef.current = null;
    dragPointerIdRef.current = null;
    dragColumnElementRef.current = null;
    suppressCardClickRef.current = false;
    setDraggedColumnId('');
    setDragOverColumnId('');
    setDraggedCardId('');
    setDragOverCardId('');
  };

  useEffect(() => {
    const handleWindowPointerUp = () => {
      if (dragPointerIdRef.current) {
        if (dragPointerIdRef.current.draggedCard) {
          finishCardDrag();
        } else {
          finishColumnDrag();
        }
      }
    };

    const handleWindowPointerCancel = () => {
      dragPointerIdRef.current = null;
      dragColumnElementRef.current = null;
      setDraggedColumnId('');
      setDragOverColumnId('');
      setDraggedCardId('');
      setDragOverCardId('');
    };

    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerCancel);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleWindowTouchCancel);

    return () => {
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerCancel);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('touchcancel', handleWindowTouchCancel);
    };
  }, [board, workspaceId, boardId]);

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

  const toggleCardAssigneeDraft = (memberId) => {
    setCardAssigneeDraft((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
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
    onlineBoardMemberIds: presenceByBoard[boardId] || [],
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
    isCardAssigneesOpen,
    isCardDeletingOpen,
    isBoardViewersOpen,
    isAssigneeMenuOpen,
    cardAssigneeDraft,
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
    draggedColumnId,
    dragOverColumnId,
    draggedCardId,
    dragOverCardId,
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
    openCardAssigneesModal,
    closeCardAssigneesModal,
    toggleCardAssigneeDraft,
    saveCardAssignees,
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
    handleColumnDragStart,
    handleColumnDragMove,
    handleColumnDragEnd,
    handleColumnTouchStart,
    handleCardDragStart,
    handleCardDragMove,
    handleCardDragEnd,
    handleCardTouchStart,
    handleCardPointerDown,
    handleCardPointerMove,
    handleCardPointerUp,
    handleCardPointerCancel,
    suppressCardClickRef,
    setIsEditOpen,
    setIsDeletingOpen,
    setIsListOpen,
    setIsListEditOpen,
    setIsListDeletingOpen,
    setIsCardOpen,
    setIsCardDetailOpen,
    setIsCardDeletingOpen,
    setIsBoardViewersOpen,
    setIsAssigneeMenuOpen,
  };
}
