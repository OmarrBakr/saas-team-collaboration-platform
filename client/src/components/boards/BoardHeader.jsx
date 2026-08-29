import { useNavigate } from "react-router-dom";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export default function BoardHeader({
  workspaceId,
  board,
  isAdmin,
  onlineBoardMemberIds,
  onEdit,
  onDelete,
  onViewers,
}) {
  const navigate = useNavigate();
  const cardCount =
    board.columns?.reduce(
      (count, column) => count + (column.cards?.length || 0),
      0,
    ) || 0;

  return (
    <header className="workspace-hero board-hero">
      <div className="workspace-hero-actions">
        <button
          type="button"
          className="workspace-back-btn"
          onClick={() => navigate(`/workspaces/${workspaceId}`)}
        >
          Back
        </button>
        {isAdmin && (
          <div className="board-action-group">
            <button
              type="button"
              className="workspace-edit-btn"
              onClick={onEdit}
            >
              Edit board
            </button>
            <button
              type="button"
              className="workspace-delete-btn"
              onClick={onDelete}
            >
              Delete board
            </button>
          </div>
        )}
      </div>
      <div className="workspace-hero-main">
        <div>
          <p className="dashboard-kicker">Board</p>
          <h1>{board.name}</h1>
          {board.description ? (
            <p className="dashboard-intro">{board.description}</p>
          ) : null}
        </div>
      </div>
      <div className="board-meta-row">
        <span className="workspace-badge">
          {board.columns?.length || 0} lists
        </span>
        <span className="workspace-badge">{cardCount} cards</span>
        <button
          type="button"
          className="workspace-badge board-viewers-badge"
          onClick={onViewers}
          aria-label={`Show ${onlineBoardMemberIds.length} people viewing this board`}
        >
          <span aria-hidden="true">◉</span> {onlineBoardMemberIds.length}{" "}
          viewing
        </button>
        <span className="workspace-badge">
          Updated {formatDate(board.updatedAt)}
        </span>
      </div>
    </header>
  );
}
