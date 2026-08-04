import { useNavigate, useParams } from 'react-router-dom';

import useBoardPage from '../hooks/useBoardPage';
import BoardEditModal from '../components/boards/BoardEditModal';
import BoardDangerModal from '../components/boards/BoardDangerModal';
import ListCreateModal from '../components/boards/ListCreateModal';
import ListEditModal from '../components/boards/ListEditModal';
import ListDangerModal from '../components/boards/ListDangerModal';
import CardCreateModal from '../components/boards/CardCreateModal';
import CardDetailModal from '../components/boards/CardDetailModal';
import CardAssigneesModal from '../components/boards/CardAssigneesModal';
import CardDangerModal from '../components/boards/CardDangerModal';
import '../styles/dashboard.css';
import '../styles/workspace.css';
import '../styles/board.css';
import '../styles/modals.css';

const formatDate = (value) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const formatCardDueDate = (value) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));

export default function BoardPage() {
  const navigate = useNavigate();
  const { workspaceId, boardId } = useParams();
  const {
    user,
    board,
    loading,
    error,
    isAdmin,
    isEditOpen,
    isDeletingOpen,
    isEditingBoard,
    isDeletingBoard,
    editError,
    deleteError,
    listError,
    cardError,
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
    attachmentError,
    hasBoardEditChanges,
    hasCardDetailChanges,
    workspaceMembers,
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
    openCardAssigneesModal,
    handleListChange,
    handleCardChange,
    handleCardDetailChange,
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
    toggleAssignee,
    hasListEditChanges,
    cardAssigneeDraft,
    setIsEditOpen,
    setIsDeletingOpen,
    setIsListOpen,
    setIsListEditOpen,
    setIsListDeletingOpen,
    setIsCardOpen,
    setIsCardDetailOpen,
    closeCardAssigneesModal,
    toggleCardAssigneeDraft,
    saveCardAssignees,
    setIsCardDeletingOpen,
  } = useBoardPage(workspaceId, boardId);

  if (loading) {
    return;
  }

  if (error || !board) {
    return (
      <main className="workspace-shell workspace-shell--centered">
        <section className="workspace-empty-card" aria-live="polite">
          <p className="panel-label">Board</p>
          <h1>{error?.toLowerCase?.().includes('not found') ? 'Board not found' : 'Board unavailable'}</h1>
          <p className="workspace-empty-copy">
            {error || 'The board you are looking for could not be loaded.'}
          </p>

          <div className="workspace-empty-actions">
            <button type="button" className="workspace-back-btn" onClick={() => navigate(`/workspaces/${workspaceId}`)}>
              Back to workspace
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="workspace-shell board-shell">
      <header className="workspace-hero board-hero">
        <div className="workspace-hero-actions">
          <button type="button" className="workspace-back-btn" onClick={() => navigate(`/workspaces/${workspaceId}`)}>
            Back
          </button>

          {isAdmin && (
            <div className="board-action-group">
              <button type="button" className="workspace-edit-btn" onClick={openEditModal}>
                Edit board
              </button>
              <button type="button" className="workspace-delete-btn" onClick={() => setIsDeletingOpen(true)}>
                Delete board
              </button>
            </div>
          )}
        </div>

        <div className="workspace-hero-main">
          <div>
            <p className="dashboard-kicker">Board</p>
            <h1>{board.name}</h1>
            <p className="dashboard-intro">
              {board.description || 'Board details, lists, and cards in one place.'}
            </p>
          </div>
        </div>

        <div className="board-meta-row">
          <span className="workspace-badge">{board.columns?.length || 0} lists</span>
          <span className="workspace-badge">{board.columns?.reduce((count, column) => count + (column.cards?.length || 0), 0) || 0} cards</span>
          <span className="workspace-badge">Updated {formatDate(board.updatedAt)}</span>
        </div>
      </header>

      {error && <div className="dashboard-alert">{error}</div>}

      <section className="board-columns">
        {board.columns?.length ? (
          <>
            {board.columns.map((column) => (
              <article key={column._id} className="board-column-card">
                <div className="panel-head">
                  <div className="board-list-head">
                    <h2>{column.title}</h2>
                    <div className="board-list-actions">
                      <span className="workspace-badge">{column.cards?.length || 0}</span>
                      {isAdmin && (
                        <div className="board-list-menu-wrap">
                          <button
                            type="button"
                            className="board-list-menu-btn"
                            aria-label={`Open actions for ${column.title}`}
                            aria-haspopup="menu"
                            aria-expanded={listMenuOpenId === column._id}
                            onClick={() => openListMenu(column._id)}
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                              <circle cx="6" cy="12" r="1.8" />
                              <circle cx="12" cy="12" r="1.8" />
                              <circle cx="18" cy="12" r="1.8" />
                            </svg>
                          </button>

                          {listMenuOpenId === column._id && (
                            <div className="board-list-menu" role="menu" onMouseLeave={closeListMenu}>
                              <button type="button" role="menuitem" onClick={() => openEditListModal(column)}>
                                Edit list
                              </button>
                              <button type="button" role="menuitem" onClick={() => openDeleteListModal(column)}>
                                Delete list
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {column.cards?.length ? (
                    <div className="board-card-list">
                      {column.cards.map((card) => (
                        <button
                          type="button"
                          key={card._id}
                          className="board-card-item board-card-item--button"
                          onClick={() => openCardDetailModal(card, column)}
                        >
                          <strong>{card.title}</strong>
                          {card.description && (
                            <span className="board-card-meta-description">
                              {card.description}
                            </span>
                          )}
                          {(card.priority || card.dueDate || card.assignees?.length || card.labels?.length || card.attachments?.length) ? (
                            <div className="board-card-meta">
                              {card.priority && (
                                <span className={`board-priority board-priority--${card.priority}`}>
                                  {card.priority}
                                </span>
                              )}

                              {card.dueDate && (
                                <span className="board-card-meta-item">
                                  Due {formatCardDueDate(card.dueDate)}
                                </span>
                              )}

                              {card.assignees?.length ? (
                                <span className="board-card-meta-item">
                                  {card.assignees.length} assignee{card.assignees.length === 1 ? '' : 's'}
                                </span>
                              ) : null}

                              {card.labels?.length ? (
                                <span className="board-card-meta-item">
                                  {card.labels.length} label{card.labels.length === 1 ? '' : 's'}
                                </span>
                              ) : null}

                              {card.attachments?.length ? (
                                <span className="board-card-meta-item">
                                  {card.attachments.length} attachment{card.attachments.length === 1 ? '' : 's'}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                ) : (
                  <p className="empty-state">No cards in this list.</p>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    className="board-add-card-btn"
                    onClick={() => openCardModal(column)}
                  >
                    Add card
                  </button>
                )}
              </article>
            ))}

            {isAdmin && (
              <button type="button" className="board-create-list-btn" onClick={openListModal}>
                + Create list
              </button>
            )}
          </>
        ) : (
          <section className="workspace-empty-card board-empty-state">
            <p className="panel-label">Lists</p>
            <h2>No lists yet</h2>
            <p className="workspace-empty-copy">
              Create your first list to start organizing cards on this board.
            </p>
            {isAdmin && (
              <button type="button" className="board-create-list-btn" onClick={openListModal}>
                + Create list
              </button>
            )}
          </section>
        )}
      </section>

      <section className="board-footer-note">
        <p className="workspace-empty-copy">
          You are viewing this board as {user?.firstName || 'a workspace member'}.
        </p>
      </section>

      <BoardEditModal
        isOpen={isEditOpen}
        form={editForm}
        onChange={handleEditChange}
        onSubmit={handleEditSubmit}
        onClose={() => setIsEditOpen(false)}
        isSubmitting={isEditingBoard}
        error={editError}
        hasChanges={hasBoardEditChanges}
      />

      <BoardDangerModal
        isOpen={isDeletingOpen}
        isSubmitting={isDeletingBoard}
        error={deleteError}
        onClose={() => setIsDeletingOpen(false)}
        onConfirm={handleDeleteBoard}
      />

      <ListCreateModal
        isOpen={isListOpen}
        form={listForm}
        onChange={handleListChange}
        onSubmit={handleCreateList}
        onClose={() => setIsListOpen(false)}
        isSubmitting={isCreatingList}
        error={listError}
      />

      <ListEditModal
        isOpen={isListEditOpen}
        form={listForm}
        onChange={handleListChange}
        onSubmit={handleEditList}
        onClose={() => setIsListEditOpen(false)}
        isSubmitting={isEditingList}
        error={listError}
        hasChanges={hasListEditChanges}
      />

      <ListDangerModal
        isOpen={isListDeletingOpen}
        isSubmitting={isDeletingList}
        error={listError}
        listTitle={activeList?.title}
        onClose={() => setIsListDeletingOpen(false)}
        onConfirm={handleDeleteList}
      />

      <CardCreateModal
        isOpen={isCardOpen}
        form={cardForm}
        onChange={handleCardChange}
        onSubmit={handleCreateCard}
        onClose={() => setIsCardOpen(false)}
        isSubmitting={isCreatingCard}
        error={cardError}
        listTitle={activeList?.title}
      />

      <CardDetailModal
        isOpen={isCardDetailOpen}
        form={cardDetailForm}
        onChange={handleCardDetailChange}
        onSubmit={handleCardDetailSubmit}
        onClose={() => setIsCardDetailOpen(false)}
        isSubmitting={isEditingCard}
        error={cardError}
        attachmentError={attachmentError}
        workspaceMembers={workspaceMembers}
        card={activeCard}
        onDeleteCard={handleDeleteCard}
        onAttachmentUpload={handleAttachmentUpload}
        onDeleteAttachment={handleDeleteAttachment}
        isUploadingAttachment={isUploadingAttachment}
        labelDraft={labelDraft}
        onLabelDraftChange={handleLabelDraftChange}
        onAddLabel={addCardLabel}
        onRemoveLabel={removeCardLabel}
        hasChanges={hasCardDetailChanges}
        onOpenAssignees={openCardAssigneesModal}
      />

      <CardAssigneesModal
        isOpen={isCardAssigneesOpen}
        members={workspaceMembers}
        selectedAssignees={cardAssigneeDraft}
        onToggleAssignee={toggleCardAssigneeDraft}
        onClose={closeCardAssigneesModal}
        onSave={saveCardAssignees}
        isSaving={false}
      />

      <CardDangerModal
        isOpen={isCardDeletingOpen}
        isSubmitting={isDeletingCard}
        error={cardError}
        cardTitle={activeCard?.title}
        onClose={() => setIsCardDeletingOpen(false)}
        onConfirm={confirmDeleteCard}
      />
    </main>
  );
}
