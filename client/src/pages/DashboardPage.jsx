import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import CreateWorkspaceModal from '../components/workspaces/CreateWorkspaceModal';
import { useAuth } from '../context/AuthContext';
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspaceBoards,
  uploadWorkspaceLogo,
} from '../services/workspaces';
import '../styles/dashboard.css';

const formatDate = (value) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));

const getWorkspaceStats = async (workspaceId) => {
  const { boards } = await getWorkspaceBoards(workspaceId);

  const cardCount = (boards || []).reduce(
    (count, board) =>
      count +
      (board.columns || []).reduce(
        (columnCount, column) => columnCount + (column.cards?.length || 0),
        0
      ),
    0
  );

  return {
    boardCount: boards?.length || 0,
    cardCount,
  };
};

function Stat({ label, value }) {
  return (
    <article className="dash-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

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

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    logoFile: null,
  });

  useEffect(() => {
    const loadWorkspaces = async () => {
      setLoading(true);
      setError('');

      try {
        const { workspaces: workspaceList } = await getMyWorkspaces();
        const enriched = await Promise.all(
          workspaceList.map(async (workspace) => {
            const stats = await getWorkspaceStats(workspace._id);
            return { ...workspace, ...stats };
          })
        );

        setWorkspaces(enriched);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  const handleCreateChange = (event) => {
    const { name, value, files } = event.target;
    setCreateForm((current) => ({
      ...current,
      [name]: name === 'logoFile' ? files?.[0] || null : value,
    }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!createForm.name.trim()) {
      setCreateError('Workspace name is required.');
      return;
    }

    setIsCreating(true);

    try {
      const { workspace } = await createWorkspace({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      });

      if (createForm.logoFile) {
        await uploadWorkspaceLogo(workspace._id, createForm.logoFile);
      }

      setIsCreateOpen(false);
      setCreateForm({ name: '', description: '', logoFile: null });

      const { workspaces: workspaceList } = await getMyWorkspaces();
      const enriched = await Promise.all(
        workspaceList.map(async (workspace) => {
          const stats = await getWorkspaceStats(workspace._id);
          return { ...workspace, ...stats };
        })
      );

      setWorkspaces(enriched);
    } catch (err) {
      setCreateError(err.message || 'Something went wrong');
    } finally {
      setIsCreating(false);
    }
  };

  const totals = useMemo(
    () =>
      workspaces.reduce(
        (acc, workspace) => {
          acc.boards += workspace.boardCount || 0;
          acc.cards += workspace.cardCount || 0;
          acc.members += workspace.members?.length || 0;
          return acc;
        },
        { boards: 0, cards: 0, members: 0 }
      ),
    [workspaces]
  );

  return (
    <main className="dashboard-shell">
      <DashboardTopBar
        title={`Welcome back, ${user?.firstName || 'there'}.`}
        description="All your team workspaces live here. Jump into one and keep moving."
      />

      {error && <div className="dashboard-alert">{error}</div>}

      <section className="dashboard-grid">
        <article className="dashboard-panel dashboard-main">
          <div className="panel-head">
            <div>
              <p className="panel-label">Overview</p>
              <h2>Your workspaces</h2>
            </div>
            <div className="overview-actions">
              <span className="workspace-badge">{workspaces.length} total</span>
              <button
                type="button"
                className="workspace-create-btn"
                onClick={() => setIsCreateOpen(true)}
              >
                Create workspace
              </button>
            </div>
          </div>

          <div className="stats-row">
            <Stat label="Workspaces" value={workspaces.length} />
            <Stat label="Boards" value={totals.boards} />
            <Stat label="Cards" value={totals.cards} />
          </div>

          {loading ? (
            <p className="empty-state dashboard-loading">Loading your workspaces...</p>
          ) : workspaces.length === 0 ? (
            <p className="empty-state">
              You do not belong to any workspaces yet. Create one from the API or
              invite yourself into an existing team.
            </p>
          ) : (
            <div className="workspace-card-grid">
              {workspaces.map((workspace) => (
                <article
                  key={workspace._id}
                  className="workspace-card workspace-card-link"
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/workspaces/${workspace._id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/workspaces/${workspace._id}`);
                    }
                  }}
                >
                  <div className="panel-head">
                    <div className="workspace-title-group">
                      <div className="workspace-card-logo">
                        {workspace.logo ? (
                          <img
                            src={workspace.logo}
                            alt=""
                            aria-hidden="true"
                            className="workspace-logo-image"
                          />
                        ) : (
                          <span className="workspace-logo-fallback">
                            {getWorkspaceInitials(workspace.name)}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="panel-label">
                          {workspace.isPersonal ? 'Personal' : 'Team'}
                        </p>
                        <h3>{workspace.name}</h3>
                      </div>
                    </div>
                    <span className="workspace-badge">{workspace.boardCount} boards</span>
                  </div>

                  <p className="panel-copy">
                    {workspace.description ||
                      ' '}
                  </p>

                  <div className="workspace-card-meta">
                    <div>
                      <span>Members</span>
                      <strong>{workspace.members?.length || 0}</strong>
                    </div>
                    <div>
                      <span>Boards</span>
                      <strong>{workspace.boardCount || 0}</strong>
                    </div>
                    <div>
                      <span>Updated</span>
                      <strong>{formatDate(workspace.updatedAt)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
      {isCreateOpen && (
        <CreateWorkspaceModal
          form={createForm}
          onChange={handleCreateChange}
          onSubmit={handleCreateSubmit}
          onClose={() => setIsCreateOpen(false)}
          isSubmitting={isCreating}
          error={createError}
        />
      )}
    </main>
  );
}
