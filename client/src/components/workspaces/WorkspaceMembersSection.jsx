export default function WorkspaceMembersSection({
  members,
  onlineMemberIds,
  invitations,
  isAdmin,
  onManage,
  onInvite,
}) {
  return (
    <article className="dashboard-panel">
      <div className="panel-head">
        <div>
          <p className="panel-label">Members</p>
          <h2>Workspace members</h2>
        </div>
        {isAdmin && (
          <div className="workspace-member-actions">
            <button type="button" className="workspace-manage-btn" onClick={onManage}>
              Manage members
            </button>
            <button type="button" className="workspace-invite-btn" onClick={onInvite}>
              Invite members
            </button>
          </div>
        )}
      </div>

      {members.length === 0 && invitations.length === 0 ? (
        <p className="empty-state">No members found.</p>
      ) : (
        <div className="member-list">
          {members.map((member) => (
            <div key={member.user?._id || member.user?.id || member.user} className="member-item">
              {(() => {
                const memberId = (member.user?._id || member.user?.id || member.user)?.toString?.();
                const isOnline = onlineMemberIds.includes(memberId);

                return (
                  <span
                    className={`member-presence-dot${isOnline ? ' member-presence-dot--online' : ''}`}
                    title={isOnline ? 'Online in this workspace' : 'Offline'}
                    aria-label={isOnline ? 'Online in this workspace' : 'Offline'}
                  />
                );
              })()}
              <div>
                <strong>
                  {member.user?.firstName || member.user?.lastName
                    ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
                    : 'Member'}
                </strong>
                <span>{member.user?.email || ''}</span>
              </div>
              <div className="member-item-actions">
                <span className="role-pill">{member.role}</span>
              </div>
            </div>
          ))}
          {invitations.map((invitation) => (
            <div key={`${invitation.email}-${invitation.expiresAt}`} className="member-item">
              <div>
                <strong>
                  {invitation.firstName || invitation.lastName
                    ? `${invitation.firstName || ''} ${invitation.lastName || ''}`.trim()
                    : invitation.email}
                </strong>
                <span>{invitation.email}</span>
              </div>
              <div className="member-item-actions">
                <span className="role-pill">Pending</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
