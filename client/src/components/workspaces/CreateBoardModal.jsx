export default function CreateBoardModal({
  isOpen,
  form,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-board-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Create board</p>
            <h2 id="create-board-title">New board</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close" disabled={isSubmitting}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form className="workspace-form" onSubmit={onSubmit} noValidate>
          <label>
            <span>Board name <strong className="field-required">*</strong></span>
            <input name="name" value={form.name} onChange={onChange} placeholder="Product roadmap" maxLength={80} required />
          </label>

          <label>
            <span>Description</span>
            <textarea name="description" value={form.description} onChange={onChange} placeholder="What is this board for?" rows={4} maxLength={250} />
          </label>

          {error && <div className="dashboard-alert">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
