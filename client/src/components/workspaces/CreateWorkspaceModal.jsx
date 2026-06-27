export default function CreateWorkspaceModal({
  form,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-workspace-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Create workspace</p>
            <h2 id="create-workspace-title">New workspace</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form className="workspace-form" onSubmit={onSubmit} noValidate>
          <label>
            <span>
              Name <strong className="field-required">*</strong>
            </span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Marketing hub"
              maxLength={50}
              required
            />
          </label>

          <label>
            <span>
              Description
            </span>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="What is this workspace for?"
              rows={4}
              maxLength={200}
            />
          </label>

          <label>
            <span>
              Logo
            </span>
            <input
              name="logoFile"
              type="file"
              onChange={onChange}
              accept="image/*"
            />
          </label>

          {error && <div className="dashboard-alert">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
