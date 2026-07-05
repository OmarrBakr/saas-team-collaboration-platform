export default function RemoveMemberModal({
  member,
  onClose,
  onConfirm,
  isRemoving,
  error,
}) {
  if (!member) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-member-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Remove member</p>
            <h2 id="remove-member-title">Remove this member?</h2>
          </div>
        </div>

        <p className="modal-note">
          {member.user?.firstName || member.user?.lastName
            ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
            : 'This member'} will lose access to this workspace.
        </p>

        {error && <div className="dashboard-alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={isRemoving}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={onConfirm} disabled={isRemoving}>
            {isRemoving ? 'Removing...' : 'Remove member'}
          </button>
        </div>
      </div>
    </div>
  );
}
