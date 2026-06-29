import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import {
  deleteWorkspace,
  getWorkspace,
  getWorkspaceBoards,
  getWorkspaceMembers,
  leaveWorkspace,
  inviteWorkspaceMember,
  removeWorkspaceMember,
} from '../services/workspaces';
import '../styles/dashboard.css';

const formatDate = (value) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

function getWorkspaceInitials(name) {
  return (
    name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'W'
  );
}

export default function WorkspacePage() {
  const { user } = useAuth();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [boards, setBoards] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [destructiveAction, setDestructiveAction] = useState('leave');
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [removingMemberId, setRemovingMemberId] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => {
    const loadWorkspace = async () => {
      setLoading(true);
      setError('');

      try {
        const [workspaceResult, boardsResult, membersResult] = await Promise.all([
          getWorkspace(workspaceId),
          getWorkspaceBoards(workspaceId),
          getWorkspaceMembers(workspaceId),
        ]);

        setWorkspace(workspaceResult.workspace);
        setBoards(boardsResult.boards || []);
        setMembers(membersResult.members || []);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [workspaceId]);

  const totals = useMemo(
    () => ({
      boards: boards.length,
      cards: boards.reduce(
        (count, board) =>
          count +
          (board.columns || []).reduce(
            (columnCount, column) => columnCount + (column.cards?.length || 0),
            0
          ),
        0
      ),
      members: members.length,
    }),
    [boards, members]
  );

  const userId = user?._id || user?.id;
  const userEmail = user?.email?.toLowerCase?.();
  const currentMember = members.find((member) => {
    const memberUserId = member.user?._id || member.user?.id || member.user;
    const memberEmail = member.user?.email?.toLowerCase?.();
    return (
      memberUserId?.toString?.() === userId?.toString?.() ||
      (userEmail && memberEmail === userEmail)
    );
  });
  const adminCount = members.filter((member) => member.role === 'admin').length;
  const isOnlyAdmin = currentMember?.role === 'admin' && adminCount === 1;
  const isAdmin = currentMember?.role === 'admin';

  const handleLeave = async () => {
    setIsLeaving(true);
    setLeaveError('');

    try {
      const result = await leaveWorkspace(workspaceId);
      setIsLeaveOpen(false);

      if (result.deleted) {
        navigate('/');
        return;
      }

      navigate('/');
    } catch (err) {
      setLeaveError(err.message || 'Something went wrong');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDelete = async () => {
    setIsLeaving(true);
    setLeaveError('');

    try {
      await deleteWorkspace(workspaceId);
      setIsLeaveOpen(false);
      navigate('/');
    } catch (err) {
      setLeaveError(err.message || 'Something went wrong');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    setRemovingMemberId(memberUserId?.toString?.() || memberUserId);
    setLeaveError('');

    try {
      await removeWorkspaceMember(workspaceId, memberUserId);
      const membersResult = await getWorkspaceMembers(workspaceId);
      setMembers(membersResult.members || []);
    } catch (err) {
      setLeaveError(err.message || 'Something went wrong');
    } finally {
      setRemovingMemberId('');
    }
  };

  const openRemoveMemberModal = (member) => {
    setLeaveError('');
    setMemberToRemove(member);
  };

  const closeRemoveMemberModal = () => {
    if (isLeaving || removingMemberId) return;
    setMemberToRemove(null);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    await handleRemoveMember(memberToRemove.user?._id || memberToRemove.user?.id || memberToRemove.user);
    setMemberToRemove(null);
  };

  const handleInviteMember = async (event) => {
    event.preventDefault();
    setInviteError('');

    const trimmedEmail = inviteEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!isValidEmail) {
      setInviteError('Please enter a valid email address.');
      return;
    }

    setIsInviting(true);

    try {
      await inviteWorkspaceMember(workspaceId, { email: trimmedEmail });
      setInviteEmail('');
      setIsInviteOpen(false);
    } catch (err) {
      setInviteError(err.message || 'Something went wrong');
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return (
      <main className="workspace-shell">
        <p className="empty-state dashboard-loading">Loading workspace...</p>
      </main>
    );
  }

  if (error || !workspace) {
    return (
      <main className="workspace-shell">
        <div className="dashboard-alert">{error || 'Workspace not found'}</div>
        <button type="button" className="workspace-back-btn" onClick={() => navigate('/')}>
          Back to dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-hero">
        <div className="workspace-hero-actions">
          <button type="button" className="workspace-back-btn" onClick={() => navigate(-1)}>
            Back
          </button>

          <div className="workspace-action-group">
            {user && (
              <button
                type="button"
                className="workspace-leave-btn"
                onClick={() => {
                  setDestructiveAction('leave');
                  setIsLeaveOpen(true);
                }}
              >
                Leave workspace
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                className="workspace-delete-btn"
                onClick={() => {
                  setDestructiveAction('delete');
                  setIsLeaveOpen(true);
                }}
              >
                Delete workspace
              </button>
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

        <div className="workspace-hero-stats">
          <article className="dash-stat">
            <span>Boards</span>
            <strong>{totals.boards}</strong>
          </article>
          <article className="dash-stat">
            <span>Members</span>
            <strong>{totals.members}</strong>
          </article>
          <article className="dash-stat">
            <span>Updated</span>
            <strong>{formatDate(workspace.updatedAt)}</strong>
          </article>
        </div>
      </header>

      {error && <div className="dashboard-alert">{error}</div>}

      <section className="workspace-grid">
        <article className="dashboard-panel">
          <div className="panel-head">
            <div>
              <p className="panel-label">Boards</p>
              <h2>Workspace boards</h2>
            </div>
          </div>

          {boards.length === 0 ? (
            <p className="empty-state">No boards yet.</p>
          ) : (
            <div className="workspace-list">
              {boards.map((board) => (
                <article key={board._id} className="workspace-list-item">
                  <div>
                    <strong>{board.name}</strong>
                    <span>{board.columns?.length || 0} columns</span>
                  </div>
                  <span>{(board.columns || []).reduce((count, column) => count + (column.cards?.length || 0), 0)} cards</span>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="panel-head">
            <div>
              <p className="panel-label">Members</p>
              <h2>Workspace members</h2>
            </div>
            {isAdmin && (
              <button
                type="button"
                className="workspace-invite-btn"
                onClick={() => setIsInviteOpen(true)}
              >
                Invite members
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <p className="empty-state">No members found.</p>
          ) : (
            <div className="member-list">
              {members.map((member) => (
                <div key={member.user?._id || member.user?.id || member.user} className="member-item">
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
                    {isAdmin &&
                      (member.user?._id || member.user?.id || member.user)?.toString?.() !==
                        currentMember?.user?._id?.toString?.() &&
                      (member.user?._id || member.user?.id || member.user) && (
                        <button
                          type="button"
                          className="member-remove-btn"
                          onClick={() => openRemoveMemberModal(member)}
                          disabled={
                            removingMemberId ===
                            (member.user?._id || member.user?.id || member.user)?.toString?.()
                          }
                        >
                          {removingMemberId ===
                          (member.user?._id || member.user?.id || member.user)?.toString?.()
                            ? 'Removing...'
                            : 'Remove'}
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      {memberToRemove && (
        <div className="modal-backdrop" role="presentation" onClick={closeRemoveMemberModal}>
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
              {memberToRemove.user?.firstName || memberToRemove.user?.lastName
                ? `${memberToRemove.user?.firstName || ''} ${memberToRemove.user?.lastName || ''}`.trim()
                : 'This member'} will lose access to this workspace.
            </p>

            {leaveError && <div className="dashboard-alert">{leaveError}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={closeRemoveMemberModal}
                disabled={Boolean(removingMemberId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={confirmRemoveMember}
                disabled={Boolean(removingMemberId)}
              >
                {removingMemberId ? 'Removing...' : 'Remove member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isInviteOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => !isInviting && setIsInviteOpen(false)}>
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

            <form className="workspace-form" onSubmit={handleInviteMember} noValidate>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  inputMode="email"
                  required
                />
              </label>

              {inviteError && <div className="dashboard-alert">{inviteError}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isInviting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={isInviting}>
                  {isInviting ? 'Inviting...' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLeaveOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => !isLeaving && setIsLeaveOpen(false)}>
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

            {leaveError && <div className="dashboard-alert">{leaveError}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsLeaveOpen(false)}
                disabled={isLeaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={destructiveAction === 'delete' ? handleDelete : handleLeave}
                disabled={isLeaving}
              >
                {isLeaving
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
      )}
    </main>
  );
}
