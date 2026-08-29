import BoardColumn from "./BoardColumn";

export default function BoardColumns({
  board,
  isAdmin,
  onCreateList,
  ...props
}) {
  if (!board.columns?.length)
    return (
      <section className="workspace-empty-card board-empty-state">
        <p className="panel-label">Lists</p>
        <h2>No lists yet</h2>
        <p className="workspace-empty-copy">
          Create your first list to start organizing cards on this board.
        </p>
        {isAdmin && (
          <button
            type="button"
            className="board-create-list-btn"
            onClick={onCreateList}
          >
            + Create list
          </button>
        )}
      </section>
    );
  return (
    <>
      {board.columns.map((column) => (
        <BoardColumn
          key={column._id}
          column={column}
          isAdmin={isAdmin}
          {...props}
        />
      ))}
      {isAdmin && (
        <button
          type="button"
          className="board-create-list-btn"
          onClick={onCreateList}
        >
          + Create list
        </button>
      )}
    </>
  );
}
