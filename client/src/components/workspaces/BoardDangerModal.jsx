export default function BoardDangerModal({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-board-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Delete board</p>
            <h2 id="delete-board-title">Delete this board?</h2>
          </div>
        </div>

        <p className="modal-note">
          This will permanently delete the board and all of its columns and cards.
        </p>

        {error && <div className="dashboard-alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Deleting...' : 'Delete board'}
          </button>
        </div>
      </div>
    </div>
  );
}
