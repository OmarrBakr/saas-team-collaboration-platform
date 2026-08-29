import BoardCard from "./BoardCard";

export default function BoardColumn({
  column,
  isAdmin,
  listMenuOpenId,
  draggedColumnId,
  dragOverColumnId,
  draggedCardId,
  dragOverCardId,
  onColumnDragStart,
  onColumnDragMove,
  onColumnDragEnd,
  onColumnTouchStart,
  onOpenListMenu,
  onCloseListMenu,
  onEditList,
  onDeleteList,
  onOpenCard,
  onOpenCardModal,
  onCardPointerDown,
  onCardPointerMove,
  onCardPointerUp,
  onCardPointerCancel,
  onCardTouchStart,
  suppressCardClickRef,
}) {
  return (
    <article
      data-column-id={column._id}
      className={`board-column-card${draggedColumnId === column._id ? " board-column-card--dragging" : ""}${dragOverColumnId === column._id ? " board-column-card--drop-target" : ""}`}
    >
      <div className="panel-head">
        <div className="board-list-head">
          <h2 className="board-list-title">{column.title}</h2>
          <div className="board-list-actions">
            {isAdmin && (
              <span
                className="board-drag-handle"
                aria-hidden="true"
                title="Drag to reorder"
                onPointerDown={(event) => onColumnDragStart(column._id, event)}
                onPointerMove={onColumnDragMove}
                onPointerUp={onColumnDragEnd}
                onPointerCancel={onColumnDragEnd}
                onTouchStart={(event) => onColumnTouchStart(column._id, event)}
              >
                :::
              </span>
            )}
            <span className="workspace-badge">{column.cards?.length || 0}</span>
            {isAdmin && (
              <div className="board-list-menu-wrap">
                <button
                  type="button"
                  className="board-list-menu-btn"
                  aria-label={`Open actions for ${column.title}`}
                  aria-haspopup="menu"
                  aria-expanded={listMenuOpenId === column._id}
                  onClick={() => onOpenListMenu(column._id)}
                >
                  •••
                </button>
                {listMenuOpenId === column._id && (
                  <div
                    className="board-list-menu"
                    role="menu"
                    onMouseLeave={onCloseListMenu}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => onEditList(column)}
                    >
                      Edit list
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => onDeleteList(column)}
                    >
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
            <BoardCard
              key={card._id}
              card={card}
              columnId={column._id}
              isDragging={draggedCardId === card._id}
              isDropTarget={dragOverCardId === card._id}
              onOpen={(selected) => onOpenCard(selected, column)}
              onPointerDown={onCardPointerDown}
              onPointerMove={onCardPointerMove}
              onPointerUp={onCardPointerUp}
              onPointerCancel={onCardPointerCancel}
              onTouchStart={onCardTouchStart}
              suppressClickRef={suppressCardClickRef}
            />
          ))}
        </div>
      ) : (
        <p className="empty-state">No cards in this list.</p>
      )}
      {isAdmin && (
        <button
          type="button"
          className="board-add-card-btn"
          onClick={() => onOpenCardModal(column)}
        >
          Add card
        </button>
      )}
    </article>
  );
}
