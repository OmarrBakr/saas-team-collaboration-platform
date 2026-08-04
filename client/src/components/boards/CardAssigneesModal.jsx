export default function CardAssigneesModal({
  isOpen,
  members,
  selectedAssignees = [],
  onToggleAssignee,
  onClose,
  onSave,
  isSaving,
  error,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !isSaving && onClose()}>
      <div
        className="modal-card modal-card--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-assignees-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Card assignees</p>
            <h2 id="card-assignees-title">Assign members to this card</h2>
          </div>
        </div>

        <div className="manage-member-list">
          {members.length ? (
            members.map((member) => {
              const memberId = (member.user?._id || member.user?.id || member.user || '').toString();
              const memberName = member.user?.firstName || member.user?.lastName
                ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
                : member.user?.email || 'Member';
              const isSelected = selectedAssignees.includes(memberId);

              return (
                <button
                  key={memberId}
                  type="button"
                  className={`manage-member-row card-assignee-row${isSelected ? ' card-assignee-row--selected' : ''}`}
                  onClick={() => onToggleAssignee(memberId)}
                  aria-pressed={isSelected}
                  disabled={isSaving}
                >
                  <div className="manage-member-info">
                    <strong>{memberName}</strong>
                    <span>{member.user?.email || ''}</span>
                  </div>

                  <span className={`role-pill card-assignee-pill${isSelected ? ' card-assignee-pill--selected' : ''}`}>
                    {isSelected ? 'Selected' : 'Select'}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="empty-state">No members available.</p>
          )}
        </div>

        {error && <div className="dashboard-alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className="primary-btn" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save assignees'}
          </button>
        </div>
      </div>
    </div>
  );
}
