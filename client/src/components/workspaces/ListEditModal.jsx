export default function ListEditModal({
  isOpen,
  form,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  hasChanges,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-list-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Edit list</p>
            <h2 id="edit-list-title">Update list details</h2>
          </div>
        </div>

        <form className="workspace-form" onSubmit={onSubmit} noValidate>
          <label>
            <span>
              List name <strong className="field-required">*</strong>
            </span>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="In progress"
              required
            />
          </label>

          {error && <div className="dashboard-alert">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isSubmitting || !hasChanges}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
