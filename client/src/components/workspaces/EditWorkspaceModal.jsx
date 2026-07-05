export default function EditWorkspaceModal({
  isOpen,
  workspace,
  form,
  onChange,
  onLogoChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  logoPreview,
  hasChanges,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-workspace-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Edit workspace</p>
            <h2 id="edit-workspace-title">Update workspace details</h2>
          </div>
        </div>

        <form className="workspace-form" onSubmit={onSubmit} noValidate>
          <label>
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Workspace name"
              required
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Workspace description"
              rows="4"
            />
          </label>

          <label>
            <span>Logo</span>
            <input type="file" accept="image/*" onChange={onLogoChange} />
          </label>

          {logoPreview && (
            <div className="workspace-edit-logo-preview">
              <img src={logoPreview} alt="" aria-hidden="true" />
            </div>
          )}

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
