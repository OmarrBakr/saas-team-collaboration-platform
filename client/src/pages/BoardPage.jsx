import { useNavigate, useParams } from "react-router-dom";

import useBoardPage from "../hooks/useBoardPage";
import BoardHeader from "../components/boards/BoardHeader";
import BoardColumns from "../components/boards/BoardColumns";
import BoardModals from "../components/boards/BoardModals";
import "../styles/dashboard.css";
import "../styles/workspace.css";
import "../styles/board.css";
import "../styles/modals.css";

export default function BoardPage() {
  const navigate = useNavigate();
  const { workspaceId, boardId } = useParams();
  const boardPage = useBoardPage(workspaceId, boardId);
  const {
    user,
    board,
    loading,
    error,
    isAdmin,
    workspaceMembers,
    onlineBoardMemberIds,
    openEditModal,
    handleDeleteBoard,
    openListModal,
    setIsDeletingOpen,
    setIsBoardViewersOpen,
    draggedColumnId,
    dragOverColumnId,
    draggedCardId,
    dragOverCardId,
    listMenuOpenId,
    openListMenu,
    closeListMenu,
    openEditListModal,
    openDeleteListModal,
    handleColumnDragStart,
    handleColumnDragMove,
    handleColumnDragEnd,
    handleColumnTouchStart,
    openCardDetailModal,
    openCardModal,
    handleCardPointerDown,
    handleCardPointerMove,
    handleCardPointerUp,
    handleCardPointerCancel,
    handleCardTouchStart,
    suppressCardClickRef,
    ...rest
  } = boardPage;

  if (loading) return null;

  if (error || !board) {
    return (
      <main className="workspace-shell workspace-shell--centered">
        <section className="workspace-empty-card" aria-live="polite">
          <p className="panel-label">Board</p>
          <h1>
            {error?.toLowerCase?.().includes("not found")
              ? "Board not found"
              : "Board unavailable"}
          </h1>
          <p className="workspace-empty-copy">
            {error || "The board you are looking for could not be loaded."}
          </p>
          <div className="workspace-empty-actions">
            <button
              type="button"
              className="workspace-back-btn"
              onClick={() => navigate(`/workspaces/${workspaceId}`)}
            >
              Back to workspace
            </button>
          </div>
        </section>
      </main>
    );
  }

  const columnProps = {
    listMenuOpenId,
    draggedColumnId,
    dragOverColumnId,
    draggedCardId,
    dragOverCardId,
    onColumnDragStart: handleColumnDragStart,
    onColumnDragMove: handleColumnDragMove,
    onColumnDragEnd: handleColumnDragEnd,
    onColumnTouchStart: handleColumnTouchStart,
    onOpenListMenu: openListMenu,
    onCloseListMenu: closeListMenu,
    onEditList: openEditListModal,
    onDeleteList: openDeleteListModal,
    onOpenCard: openCardDetailModal,
    onOpenCardModal: openCardModal,
    onCardPointerDown: handleCardPointerDown,
    onCardPointerMove: handleCardPointerMove,
    onCardPointerUp: handleCardPointerUp,
    onCardPointerCancel: handleCardPointerCancel,
    onCardTouchStart: handleCardTouchStart,
    suppressCardClickRef,
  };

  const modalState = {
    ...rest,
    user,
    isAdmin,
    workspaceMembers,
    onlineBoardMemberIds,
  };
  const modalActions = { ...rest, onlineBoardMemberIds };

  return (
    <main className="workspace-shell board-shell">
      <BoardHeader
        workspaceId={workspaceId}
        board={board}
        isAdmin={isAdmin}
        onlineBoardMemberIds={onlineBoardMemberIds}
        onEdit={openEditModal}
        onDelete={() => setIsDeletingOpen(true)}
        onViewers={() => setIsBoardViewersOpen(true)}
      />
      {error && <div className="dashboard-alert">{error}</div>}
      <section className="board-columns">
        <BoardColumns
          board={board}
          isAdmin={isAdmin}
          onCreateList={openListModal}
          {...columnProps}
        />
      </section>
      <section className="board-footer-note">
        <p className="workspace-empty-copy">
          You are viewing this board as{" "}
          {user?.firstName || "a workspace member"}.
        </p>
      </section>
      <BoardModals state={modalState} actions={modalActions} />
    </main>
  );
}
