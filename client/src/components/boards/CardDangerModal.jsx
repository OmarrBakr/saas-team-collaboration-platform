export default function CardDangerModal({
  isOpen,
  isSubmitting,
  error,
  onClose,
  onConfirm,
  cardTitle,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-card-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Delete card</p>
            <h2 id="delete-card-title">Delete {cardTitle || 'this card'}?</h2>
          </div>
        </div>

        <p className="modal-note">
          This will permanently delete the card and all of its attachments.
        </p>

        {error && <div className="dashboard-alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Deleting...' : 'Delete card'}
          </button>
        </div>
      </div>
    </div>
  );
}
