export default function WorkspaceDangerModal({
  isOpen,
  destructiveAction,
  isOnlyAdmin,
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
        aria-labelledby="leave-workspace-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">
              {destructiveAction === 'delete' ? 'Delete workspace' : 'Leave workspace'}
            </p>
            <h2 id="leave-workspace-title">
              {destructiveAction === 'delete'
                ? 'Delete this workspace?'
                : isOnlyAdmin
                  ? 'Leaving will delete this workspace'
                  : 'Confirm leaving this workspace'}
            </h2>
          </div>
        </div>

        <p className="modal-note">
          {destructiveAction === 'delete'
            ? 'This will permanently delete the workspace and all of its boards.'
            : isOnlyAdmin
              ? 'You are the only admin here. If you leave, the workspace and its boards will be deleted.'
              : 'You will lose access to this workspace if you continue.'}
        </p>

        {error && <div className="dashboard-alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting
              ? destructiveAction === 'delete'
                ? 'Deleting...'
                : 'Leaving...'
              : destructiveAction === 'delete'
                ? 'Delete workspace'
                : isOnlyAdmin
                  ? 'Leave and delete'
                  : 'Leave workspace'}
          </button>
        </div>
      </div>
    </div>
  );
}
