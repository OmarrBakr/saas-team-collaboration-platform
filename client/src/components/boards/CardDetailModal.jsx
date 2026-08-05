export default function CardDetailModal({
  isOpen,
  form,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  attachmentError,
  workspaceMembers,
  card,
  onDeleteCard,
  onAttachmentUpload,
  onDeleteAttachment,
  isUploadingAttachment,
  labelDraft,
  onLabelDraftChange,
  onAddLabel,
  onRemoveLabel,
  hasChanges,
  onOpenAssignees,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="modal-card modal-card--wide modal-card--scrollable"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="panel-label">Card</p>
            <h2 id="card-detail-title">{card?.title || 'Card details'}</h2>
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

        <form className="workspace-form card-detail-form" onSubmit={onSubmit} noValidate>
          <div className="card-detail-section">
            <label>
              <span>
                Title <strong className="field-required">*</strong>
              </span>
              <input name="title" value={form.title} onChange={onChange} required />
            </label>

            <label>
              <span>Description</span>
              <textarea name="description" value={form.description} onChange={onChange} rows="4" />
            </label>

            <div className="board-detail-grid">
              <label>
                <span>Priority</span>
                <select name="priority" className="manage-role-select" value={form.priority} onChange={onChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label>
                <span>Due date</span>
                <input type="date" name="dueDate" value={form.dueDate} onChange={onChange} />
              </label>
            </div>

            <div className="card-assignee-field">
              <span className="card-assignee-label">
                <span>Assignees</span>
                <button type="button" className="card-assignee-open-btn" onClick={onOpenAssignees}>
                  Assign members
                </button>
              </span>
              <div className="card-assignee-chip-list">
                {workspaceMembers
                  .filter((member) => {
                    const memberId = (member.user?._id || member.user?.id || member.user || '').toString();
                    return form.assignees.includes(memberId);
                  })
                  .map((member) => {
                    const memberId = (member.user?._id || member.user?.id || member.user || '').toString();
                    const memberName = member.user?.firstName || member.user?.lastName
                      ? `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim()
                      : member.user?.email || 'Member';

                    return (
                      <div key={memberId} className="card-assignee-text">
                        <strong>{memberName}</strong>
                        <span>{member.user?.email || ''}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <section className="card-label-section">
              <div className="panel-head">
                <p className="panel-label">Labels</p>
              </div>

              <div className="card-label-chip-list">
                {form.labels.length ? (
                  form.labels.map((label, index) => (
                    <button
                      key={`${label.title}-${label.color}-${index}`}
                      type="button"
                      className="card-label-chip"
                      style={{ backgroundColor: label.color || '#9fb6ff' }}
                      onClick={() => onRemoveLabel(index)}
                      title="Remove label"
                    >
                      <span>{label.title}</span>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  ))
                ) : (
                  <p className="empty-state">No labels yet.</p>
                )}
              </div>

              <div className="card-label-draft">
                <input
                  name="title"
                  value={labelDraft.title}
                  onChange={onLabelDraftChange}
                  placeholder="Label title"
                />
                <div className="card-label-draft-actions">
                  <input
                    name="color"
                    type="color"
                    value={labelDraft.color}
                    onChange={onLabelDraftChange}
                  />
                  <button type="button" className="secondary-btn card-label-add-btn" onClick={onAddLabel}>
                    Add label
                  </button>
                </div>
              </div>
            </section>

            <section className="board-attachment-box">
              <div className="panel-head">
                <p className="panel-label">Attachments</p>
              </div>

              {card?.attachments?.length ? (
                <div className="board-attachment-list">
                  {card.attachments.map((attachment) => (
                    <div key={attachment._id} className="board-attachment-row">
                      <a href={attachment.url} target="_blank" rel="noreferrer">
                        {attachment.title}
                      </a>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => onDeleteAttachment(attachment._id)}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No attachments yet.</p>
              )}

              <label>
                <span>Upload attachment</span>
                <input type="file" onChange={onAttachmentUpload} disabled={isUploadingAttachment} />
              </label>

              {attachmentError && <div className="dashboard-alert">{attachmentError}</div>}
            </section>
          </div>

          {error && <div className="dashboard-alert card-detail-error">{error}</div>}

          <div className="modal-actions modal-actions--space-between card-detail-footer">
            <button type="button" className="workspace-delete-btn" onClick={onDeleteCard} disabled={isSubmitting}>
              Delete card
            </button>

            <div className="modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={isSubmitting || !form.title.trim() || !onSubmit || !hasChanges}
              >
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
