export default function ManageMembersModal({
  isOpen,
  members,
  invitations,
  currentMemberId,
  isAdmin,
  draftMemberRoles,
  onDraftRoleChange,
  onRemoveMember,
  onClose,
  onSave,
  isSaving,
  error,
  hasRoleChanges,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card modal-card--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-members-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Manage members</p>
            <h2 id="manage-members-title">Change roles or remove members</h2>
          </div>
        </div>

        <div className="manage-member-list">
          {members.map((member) => {
            const memberUserId = member.user?._id || member.user?.id || member.user;
            const memberKey = memberUserId?.toString?.() || memberUserId;
            const isSelf = memberKey === currentMemberId?.toString?.();

            return (
              <div key={memberKey} className="manage-member-row">
                <div className="manage-member-info">
                  <strong>
                    {member.user?.firstName || member.user?.lastName
                      ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
                      : 'Member'}
                  </strong>
                  <span>{member.user?.email || ''}</span>
                </div>

                <div className="manage-member-actions">
                  <select
                    className="manage-role-select"
                    value={draftMemberRoles[memberKey] || member.role}
                    onChange={(event) => onDraftRoleChange(memberKey, event.target.value)}
                    disabled={!isAdmin || isSelf || isSaving}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>

                  {!isSelf && (
                    <button
                      type="button"
                      className="member-remove-btn"
                      onClick={() => onRemoveMember(member)}
                      disabled={isSaving}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {invitations.map((invitation) => (
            <div key={`${invitation.email}-${invitation.expiresAt}`} className="manage-member-row">
              <div className="manage-member-info">
                <strong>
                  {invitation.firstName || invitation.lastName
                    ? `${invitation.firstName || ''} ${invitation.lastName || ''}`.trim()
                    : invitation.email}
                </strong>
                <span>{invitation.email}</span>
              </div>

              <div className="manage-member-actions">
                <span className="role-pill">Pending</span>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="dashboard-alert">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary-btn" onClick={onSave} disabled={isSaving || !hasRoleChanges}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
