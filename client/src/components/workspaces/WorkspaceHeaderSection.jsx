export default function WorkspaceHeaderSection({
  user,
  workspace,
  isAdmin,
  onBack,
  onLeave,
  onDelete,
  onEdit,
}) {
  const getWorkspaceInitials = (name) =>
    (
      name
        ?.split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase() || 'W'
    );

  return (
    <header className="workspace-hero">
      <div className="workspace-hero-actions">
        <button type="button" className="workspace-back-btn" onClick={onBack}>
          Back
        </button>

        <div className="workspace-action-group">
          {user && (
            <button type="button" className="workspace-leave-btn" onClick={onLeave}>
              Leave workspace
            </button>
          )}

          {isAdmin && (
            <>
              <button type="button" className="workspace-delete-btn" onClick={onDelete}>
                Delete workspace
              </button>
              <button type="button" className="workspace-edit-btn" onClick={onEdit}>
                Edit workspace
              </button>
            </>
          )}
        </div>
      </div>

      <div className="workspace-hero-main">
        <div className="workspace-hero-mark">
          {workspace.logo ? (
            <img src={workspace.logo} alt="" aria-hidden="true" className="workspace-hero-logo" />
          ) : (
            <span>{getWorkspaceInitials(workspace.name)}</span>
          )}
        </div>

        <div>
          <p className="dashboard-kicker">{workspace.isPersonal ? 'Personal workspace' : 'Team workspace'}</p>
          <h1>{workspace.name}</h1>
          <p className="dashboard-intro">{workspace.description || 'Workspace overview, boards, and members in one place.'}</p>
        </div>
      </div>
    </header>
  );
}
