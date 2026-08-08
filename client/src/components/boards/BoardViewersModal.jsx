export default function BoardViewersModal({ isOpen, members, onlineMemberIds, onClose }) {
  if (!isOpen) return null;

  const viewers = onlineMemberIds.map((memberId) => {
    const member = members.find((entry) => {
      const entryId = entry.user?._id || entry.user?.id || entry.user;
      return entryId?.toString?.() === memberId?.toString?.();
    });

    return {
      id: memberId,
      name: member?.user?.firstName || member?.user?.lastName
        ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
        : member?.user?.email || 'Member',
      email: member?.user?.email || '',
    };
  });

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="board-viewers-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Board presence</p>
            <h2 id="board-viewers-title">Currently viewing this board</h2>
          </div>
        </div>

        <div className="manage-member-list">
          {viewers.length ? (
            viewers.map((viewer) => (
              <div key={viewer.id} className="manage-member-row">
                <div className="manage-member-info">
                  <strong>{viewer.name}</strong>
                  <span>{viewer.email}</span>
                </div>
                <svg className="board-viewers-modal-icon" viewBox="0 0 24 24" aria-label="Currently viewing" role="img">
                  <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              </div>
            ))
          ) : (
            <p className="empty-state">No one is currently viewing this board.</p>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
