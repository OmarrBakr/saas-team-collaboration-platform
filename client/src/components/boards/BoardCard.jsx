const formatDueDate = (value) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(value),
  );

export default function BoardCard({
  card,
  columnId,
  isDragging,
  isDropTarget,
  onOpen,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onTouchStart,
  suppressClickRef,
}) {
  return (
    <button
      type="button"
      data-column-id={columnId}
      data-card-id={card._id}
      className={`board-card-item board-card-item--button${isDragging ? " board-card-item--dragging" : ""}${isDropTarget ? " board-card-item--drop-target" : ""}`}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onOpen(card);
      }}
      onPointerDown={(event) => onPointerDown(columnId, card._id, event)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onTouchStart={(event) => onTouchStart(columnId, card._id, event)}
    >
      <div className="board-card-head">
        <strong>{card.title}</strong>
      </div>
      {card.description && (
        <span className="board-card-meta-description">{card.description}</span>
      )}
      {card.priority ||
      card.dueDate ||
      card.assignees?.length ||
      card.labels?.length ||
      card.attachments?.length ? (
        <div className="board-card-meta">
          {card.priority && (
            <span className={`board-priority board-priority--${card.priority}`}>
              {card.priority}
            </span>
          )}
          {card.dueDate && (
            <span className="board-card-meta-item">
              Due {formatDueDate(card.dueDate)}
            </span>
          )}
          {card.assignees?.length ? (
            <span className="board-card-meta-item">
              {card.assignees.length} assignee
              {card.assignees.length === 1 ? "" : "s"}
            </span>
          ) : null}
          {card.labels?.map((label, index) => (
            <span
              key={`${label.name || "label"}-${index}`}
              className="board-card-label-chip"
              style={{ backgroundColor: label.color || "#9fb6ff" }}
            >
              {label.name}
            </span>
          ))}
          {card.attachments?.length ? (
            <span className="board-card-meta-item">
              {card.attachments.length} attachment
              {card.attachments.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}
