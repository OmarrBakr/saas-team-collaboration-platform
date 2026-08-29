import { useEffect, useRef, useState } from "react";
import { moveCard, moveList } from "../services/boards";

export default function useBoardDragAndDrop({
  board,
  setBoard,
  isAdmin,
  workspaceId,
  boardId,
  setError,
}) {
  const [draggedColumnId, setDraggedColumnId] = useState("");
  const [dragOverColumnId, setDragOverColumnId] = useState("");
  const [draggedCardId, setDraggedCardId] = useState("");
  const [dragOverCardId, setDragOverCardId] = useState("");
  const dragPointerIdRef = useRef(null);
  const dragColumnElementRef = useRef(null);
  const dragTouchIdRef = useRef(null);
  const dragCardTouchIdRef = useRef(null);
  const suppressCardClickRef = useRef(false);
  const cardPointerStartRef = useRef(null);
  const cardLongPressTimerRef = useRef(null);
  const cardLongPressStateRef = useRef({
    columnId: "",
    cardId: "",
    touchId: null,
  });

  const finishColumnDrag = async () => {
    const draggedId = dragPointerIdRef.current?.draggedColumnId;
    const targetId = dragPointerIdRef.current?.dragOverColumnId;

    dragPointerIdRef.current = null;
    dragColumnElementRef.current = null;

    if (!board?.columns?.length || !draggedId || !targetId) {
      setDraggedColumnId("");
      setDragOverColumnId("");
      return;
    }

    const columns = board.columns || [];
    const fromIndex = columns.findIndex(
      (column) => column._id?.toString() === draggedId.toString(),
    );
    const toIndex = columns.findIndex(
      (column) => column._id?.toString() === targetId.toString(),
    );

    setDraggedColumnId("");
    setDragOverColumnId("");

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
      const result = await moveList(workspaceId, boardId, draggedId, {
        toPosition: toIndex,
      });
      setBoard(result.board);
    } catch (err) {
      setError(err.message || "Something went wrong");
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
    const columnElement = element?.closest?.("[data-column-id]");
    const columnId = columnElement?.dataset?.columnId || "";

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
    if (
      !dragPointerIdRef.current ||
      event.pointerId !== dragPointerIdRef.current.pointerId
    )
      return;
    event.preventDefault();
    updateDragTargetFromPoint(event.clientX, event.clientY);
  };

  const handleColumnDragEnd = async (event) => {
    if (
      dragPointerIdRef.current &&
      event?.pointerId !== dragPointerIdRef.current.pointerId
    )
      return;
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

  const handleCardDragMove = (event) => {
    if (
      !dragPointerIdRef.current?.draggedCard ||
      event.pointerId !== dragPointerIdRef.current.pointerId
    )
      return;
    event.preventDefault();

    const element = document.elementFromPoint(event.clientX, event.clientY);
    const cardElement = element?.closest?.("[data-card-id]");
    const columnElement = element?.closest?.("[data-column-id]");
    const cardId = cardElement?.dataset?.cardId || "";
    const columnId =
      cardElement?.dataset?.columnId || columnElement?.dataset?.columnId || "";

    if (cardId && columnId) {
      setDragOverCardId(cardId);
      dragPointerIdRef.current = {
        ...dragPointerIdRef.current,
        dragOverCard: { columnId, cardId },
      };
    }
  };

  const handleCardDragEnd = async (event) => {
    if (
      dragPointerIdRef.current &&
      event?.pointerId !== dragPointerIdRef.current.pointerId
    )
      return;
    await finishCardDrag();
  };
  const finishCardDrag = async () => {
    const dragged = dragPointerIdRef.current?.draggedCard;
    const target = dragPointerIdRef.current?.dragOverCard;

    dragPointerIdRef.current = null;
    dragCardTouchIdRef.current = null;

    if (!dragged || !target) {
      setDraggedCardId("");
      setDragOverCardId("");
      return;
    }

    const fromColumnIndex = board?.columns?.findIndex(
      (column) => column._id?.toString() === dragged.columnId?.toString(),
    );
    const toColumnIndex = board?.columns?.findIndex(
      (column) => column._id?.toString() === target.columnId?.toString(),
    );

    if (fromColumnIndex < 0 || toColumnIndex < 0) {
      setDraggedCardId("");
      setDragOverCardId("");
      return;
    }

    const fromColumn = board.columns[fromColumnIndex];
    const toColumn = board.columns[toColumnIndex];
    const fromIndex = fromColumn.cards.findIndex(
      (card) => card._id?.toString() === dragged.cardId.toString(),
    );
    let toIndex = toColumn.cards.findIndex(
      (card) => card._id?.toString() === target.cardId.toString(),
    );

    setDraggedCardId("");
    setDragOverCardId("");

    if (fromIndex < 0) return;
    if (toIndex < 0) toIndex = toColumn.cards.length;
    if (
      fromColumn._id?.toString() === toColumn._id?.toString() &&
      fromIndex === toIndex
    ) {
      return;
    }

    setBoard((current) => {
      if (!current?.columns?.length) return current;

      const nextColumns = current.columns.map((column) => ({
        ...column,
        cards: column.cards ? [...column.cards] : [],
      }));
      const nextFromColumn = nextColumns.find(
        (column) => column._id?.toString() === dragged.columnId?.toString(),
      );
      const nextToColumn = nextColumns.find(
        (column) => column._id?.toString() === target.columnId?.toString(),
      );

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
        { position: toIndex },
      );
      setBoard(result.board);
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
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
    if (
      start &&
      !dragPointerIdRef.current?.draggedCard &&
      event.pointerId === start.pointerId
    ) {
      const distance = Math.hypot(
        event.clientX - start.startX,
        event.clientY - start.startY,
      );
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

    if (
      !dragPointerIdRef.current?.draggedCard ||
      event.pointerId !== dragPointerIdRef.current.pointerId
    ) {
      return;
    }

    event.preventDefault();

    const element = document.elementFromPoint(event.clientX, event.clientY);
    const cardElement = element?.closest?.("[data-card-id]");
    const columnElement = element?.closest?.("[data-column-id]");
    const cardId = cardElement?.dataset?.cardId || "";
    const columnId =
      cardElement?.dataset?.columnId || columnElement?.dataset?.columnId || "";

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

    if (
      dragPointerIdRef.current &&
      event?.pointerId !== dragPointerIdRef.current.pointerId
    )
      return;
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
    if (
      dragPointerIdRef.current &&
      event?.pointerId !== dragPointerIdRef.current.pointerId
    )
      return;
    dragPointerIdRef.current = null;
    dragCardTouchIdRef.current = null;
    suppressCardClickRef.current = false;
    setDraggedCardId("");
    setDragOverCardId("");
  };

  const handleCardTouchStart = (columnId, cardId, event) => {
    if (!isAdmin) return;

    const touch = event.touches?.[0];
    if (!touch) return;

    clearTimeout(cardLongPressTimerRef.current);
    cardLongPressStateRef.current = {
      columnId,
      cardId,
      touchId: touch.identifier,
    };
    cardLongPressTimerRef.current = window.setTimeout(() => {
      const state = cardLongPressStateRef.current;
      if (
        state.columnId !== columnId ||
        state.cardId !== cardId ||
        state.touchId !== touch.identifier
      ) {
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

  const handleWindowTouchMove = (event) => {
    const start = cardPointerStartRef.current;
    const touch =
      dragTouchIdRef.current !== null
        ? getTouchPoint(event.touches, dragTouchIdRef.current)
        : null;
    const activeTouch = touch || getTouchPoint(event.touches, start?.pointerId);
    if (dragTouchIdRef.current === null && !start) return;

    if (!activeTouch) return;

    event.preventDefault();
    if (start && !dragPointerIdRef.current?.draggedCard) {
      const distance = Math.hypot(
        activeTouch.clientX - start.startX,
        activeTouch.clientY - start.startY,
      );
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
      const element = document.elementFromPoint(
        activeTouch.clientX,
        activeTouch.clientY,
      );
      const cardElement = element?.closest?.("[data-card-id]");
      const columnElement = element?.closest?.("[data-column-id]");
      const cardId = cardElement?.dataset?.cardId || "";
      const columnId =
        cardElement?.dataset?.columnId ||
        columnElement?.dataset?.columnId ||
        "";
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
    cardLongPressStateRef.current = { columnId: "", cardId: "", touchId: null };
    dragTouchIdRef.current = null;
    dragPointerIdRef.current = null;
    dragColumnElementRef.current = null;
    suppressCardClickRef.current = false;
    setDraggedColumnId("");
    setDragOverColumnId("");
    setDraggedCardId("");
    setDragOverCardId("");
  };

  useEffect(() => {
    const handleWindowPointerUp = () => {
      if (!dragPointerIdRef.current) return;
      if (dragPointerIdRef.current.draggedCard) finishCardDrag();
      else finishColumnDrag();
    };
    const handleWindowPointerCancel = () => {
      dragPointerIdRef.current = null;
      dragColumnElementRef.current = null;
      setDraggedColumnId("");
      setDragOverColumnId("");
      setDraggedCardId("");
      setDragOverCardId("");
    };
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerCancel);
    window.addEventListener("touchmove", handleWindowTouchMove, {
      passive: false,
    });
    window.addEventListener("touchend", handleWindowTouchEnd, {
      passive: false,
    });
    window.addEventListener("touchcancel", handleWindowTouchCancel);
    return () => {
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);
      window.removeEventListener("touchmove", handleWindowTouchMove);
      window.removeEventListener("touchend", handleWindowTouchEnd);
      window.removeEventListener("touchcancel", handleWindowTouchCancel);
    };
  }, [board, workspaceId, boardId]);

  return {
    draggedColumnId,
    setDraggedColumnId,
    dragOverColumnId,
    setDragOverColumnId,
    draggedCardId,
    setDraggedCardId,
    dragOverCardId,
    setDragOverCardId,
    dragPointerIdRef,
    dragColumnElementRef,
    dragTouchIdRef,
    dragCardTouchIdRef,
    suppressCardClickRef,
    cardPointerStartRef,
    cardLongPressTimerRef,
    cardLongPressStateRef,
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
  };
}

export const reorderColumns = (columns, fromIndex, toIndex) => {
  const nextColumns = [...columns];
  const [movedColumn] = nextColumns.splice(fromIndex, 1);
  nextColumns.splice(toIndex, 0, movedColumn);
  return nextColumns.map((column, index) => ({ ...column, position: index }));
};

export const getTouchPoint = (touches, touchId) => {
  for (const touch of touches || []) {
    if (touch.identifier === touchId) return touch;
  }
  return null;
};
