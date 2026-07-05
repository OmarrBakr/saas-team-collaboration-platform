import { useNavigate, useParams } from 'react-router-dom';

import useWorkspacePage from '../hooks/useWorkspacePage';
import EditWorkspaceModal from '../components/workspaces/EditWorkspaceModal';
import InviteMembersModal from '../components/workspaces/InviteMembersModal';
import ManageMembersModal from '../components/workspaces/ManageMembersModal';
import RemoveMemberModal from '../components/workspaces/RemoveMemberModal';
import WorkspaceDangerModal from '../components/workspaces/WorkspaceDangerModal';
import WorkspaceHeaderSection from '../components/workspaces/WorkspaceHeaderSection';
import WorkspaceBoardsSection from '../components/workspaces/WorkspaceBoardsSection';
import WorkspaceMembersSection from '../components/workspaces/WorkspaceMembersSection';
import '../styles/dashboard.css';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const {
    user,
    workspace,
    boards,
    members,
    invitations,
    loading,
    error,
    isAdmin,
    isOnlyAdmin,
    isLeaveOpen,
    setIsLeaveOpen,
    destructiveAction,
    setDestructiveAction,
    isLeaving,
    leaveError,
    handleLeave,
    handleDelete,
    isEditOpen,
    setIsEditOpen,
    isEditingWorkspace,
    editError,
    editForm,
    handleEditChange,
    handleEditSubmit,
    editLogoPreview,
    handleEditLogoChange,
    hasWorkspaceEditChanges,
    openEditModal,
    isInviteOpen,
    setIsInviteOpen,
    inviteEmail,
    setInviteEmail,
    inviteError,
    inviteMessage,
    isInviting,
    handleInviteMember,
    isManageOpen,
    setIsManageOpen,
    openManageModal,
    currentMemberId,
    draftMemberRoles,
    handleDraftRoleChange,
    hasRoleChanges,
    handleSaveRoles,
    isSavingRoles,
    manageError,
    memberToRemove,
    openRemoveMemberModal,
    closeRemoveMemberModal,
    confirmRemoveMember,
    removingMemberId,
  } = useWorkspacePage(workspaceId);

  const isAccessDenied = error?.toLowerCase?.().includes('not a member');
  const fallbackTitle = isAccessDenied ? 'Access denied' : 'Workspace not found';
  const fallbackMessage = isAccessDenied
    ? 'You do not have access to this workspace.'
    : error || 'The workspace you are looking for could not be found.';

  if (loading) {
    return;
  }

  if (error || !workspace) {
    return (
      <main className="workspace-shell workspace-shell--centered">
        <section className="workspace-empty-card" aria-live="polite">
          <p className="panel-label">Workspace</p>
          <h1>{fallbackTitle}</h1>
          <p className="workspace-empty-copy">{fallbackMessage}</p>

          <div className="workspace-empty-actions">
            <button type="button" className="workspace-back-btn" onClick={() => navigate('/')}>
              Back to dashboard
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="workspace-shell">
      <WorkspaceHeaderSection
        user={user}
        workspace={workspace}
        isAdmin={isAdmin}
        onBack={() => navigate('/')}
        onLeave={() => {
          setDestructiveAction('leave');
          setIsLeaveOpen(true);
        }}
        onDelete={() => {
          setDestructiveAction('delete');
          setIsLeaveOpen(true);
        }}
        onEdit={openEditModal}
      />

      {error && <div className="dashboard-alert">{error}</div>}

      <section className="workspace-grid">
        <WorkspaceBoardsSection boards={boards} />
        <WorkspaceMembersSection
          members={members}
          invitations={invitations}
          isAdmin={isAdmin}
          onManage={openManageModal}
          onInvite={() => setIsInviteOpen(true)}
        />
      </section>

      <EditWorkspaceModal
        isOpen={isEditOpen}
        workspace={workspace}
        form={editForm}
        onChange={handleEditChange}
        onLogoChange={handleEditLogoChange}
        onSubmit={handleEditSubmit}
        onClose={() => setIsEditOpen(false)}
        isSubmitting={isEditingWorkspace}
        error={editError}
        logoPreview={editLogoPreview}
        hasChanges={hasWorkspaceEditChanges}
      />

      <WorkspaceDangerModal
        isOpen={isLeaveOpen}
        destructiveAction={destructiveAction}
        isOnlyAdmin={isOnlyAdmin}
        isSubmitting={isLeaving}
        error={leaveError}
        onClose={() => setIsLeaveOpen(false)}
        onConfirm={destructiveAction === 'delete' ? handleDelete : handleLeave}
      />

      <ManageMembersModal
        isOpen={isManageOpen}
        members={members}
        invitations={invitations}
        currentMemberId={currentMemberId}
        isAdmin={isAdmin}
        draftMemberRoles={draftMemberRoles}
        onDraftRoleChange={handleDraftRoleChange}
        onRemoveMember={openRemoveMemberModal}
        onClose={() => setIsManageOpen(false)}
        onSave={handleSaveRoles}
        isSaving={isSavingRoles}
        error={manageError}
        hasRoleChanges={hasRoleChanges}
      />

      <RemoveMemberModal
        member={memberToRemove}
        onClose={closeRemoveMemberModal}
        onConfirm={confirmRemoveMember}
        isRemoving={Boolean(removingMemberId)}
        error={manageError}
      />

      <InviteMembersModal
        isOpen={isInviteOpen}
        inviteEmail={inviteEmail}
        onInviteEmailChange={setInviteEmail}
        onSubmit={handleInviteMember}
        onClose={() => setIsInviteOpen(false)}
        isSubmitting={isInviting}
        error={inviteError}
        successMessage={inviteMessage}
      />
    </main>
  );
}
