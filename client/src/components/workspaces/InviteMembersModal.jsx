export default function InviteMembersModal({
  isOpen,
  inviteEmail,
  onInviteEmailChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  successMessage,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSubmitting && onClose()}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-member-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Invite members</p>
            <h2 id="invite-member-title">Invite a teammate</h2>
          </div>
        </div>

        <form className="workspace-form" onSubmit={onSubmit} noValidate>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => onInviteEmailChange(event.target.value)}
              placeholder="name@company.com"
              autoComplete="email"
              inputMode="email"
              required
            />
          </label>

          {error && <div className="dashboard-alert">{error}</div>}
          {successMessage && <div className="status-message success">{successMessage}</div>}

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Inviting...' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
