import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getWorkspace, getWorkspaceBoards, getWorkspaceMembers } from '../services/workspaces';
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
        <button type="button" className="workspace-back-btn" onClick={() => navigate(-1)}>
          Back
        </button>

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
                  <span className="role-pill">{member.role}</span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
