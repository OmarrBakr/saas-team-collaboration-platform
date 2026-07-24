export default function CardCreateModal({
  isOpen,
  form,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  listTitle,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
      <div
        className="modal-card modal-card--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-card-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Create card</p>
            <h2 id="create-card-title">Add a card to {listTitle || 'this list'}</h2>
          </div>
        </div>

        <form className="workspace-form" onSubmit={onSubmit} noValidate>
          <label>
            <span>
              Card title <strong className="field-required">*</strong>
            </span>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Design review"
              required
            />
          </label>

          {error && <div className="dashboard-alert">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
