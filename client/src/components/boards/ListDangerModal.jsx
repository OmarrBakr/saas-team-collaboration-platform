export default function ListDangerModal({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onConfirm,
  listTitle,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-list-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Delete list</p>
            <h2 id="delete-list-title">Delete {listTitle || 'this list'}?</h2>
          </div>
        </div>

        <p className="modal-note">
          This will permanently delete the list and all of its cards.
        </p>

        {error && <div className="dashboard-alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Deleting...' : 'Delete list'}
          </button>
        </div>
      </div>
    </div>
  );
}
