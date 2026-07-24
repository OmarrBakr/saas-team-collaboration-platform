export default function WorkspaceBoardsSection({ boards, onBoardClick }) {
  return (
    <article className="dashboard-panel">
      <div className="panel-head">
        <div>
          <p className="panel-label">Boards</p>
          <h2>Workspace boards</h2>
        </div>
      </div>

      {boards.length === 0 ? (
        <p className="empty-state">No boards yet.</p>
      ) : (
        <div className="workspace-list">
          {boards.map((board) => (
            <article
              key={board._id}
              className="workspace-list-item workspace-list-item--clickable"
              role="button"
              tabIndex={0}
              onClick={() => onBoardClick?.(board)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onBoardClick?.(board);
                }
              }}
            >
              <div>
                <strong>{board.name}</strong>
                <span>{board.columns?.length || 0} columns</span>
              </div>
              <span>{(board.columns || []).reduce((count, column) => count + (column.cards?.length || 0), 0)} cards</span>
            </article>
          ))}
        </div>
      )}
    </article>
  );
}
