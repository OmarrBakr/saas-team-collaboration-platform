import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import CreateWorkspaceModal from '../components/workspaces/CreateWorkspaceModal';
import { useAuth } from '../context/AuthContext';
import {
  createWorkspace,
  getMyWorkspaces,
  uploadWorkspaceLogo,
} from '../services/workspaces';
import '../styles/dashboard.css';
import { dashboardWorkspacesQueryKey } from '../hooks/useWorkspaceData';

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

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspacesQuery = useQuery({
    queryKey: dashboardWorkspacesQueryKey,
    queryFn: async () => (await getMyWorkspaces()).workspaces || [],
    enabled: Boolean(user),
  });
  const createWorkspaceMutation = useMutation({
    mutationFn: async ({ name, description, logoFile }) => {
      const { workspace } = await createWorkspace({ name, description });
      if (logoFile) await uploadWorkspaceLogo(workspace._id, logoFile);
      return workspace;
    },
    onMutate: async ({ name, description }) => {
      await queryClient.cancelQueries({ queryKey: dashboardWorkspacesQueryKey });
      const previousWorkspaces = queryClient.getQueryData(dashboardWorkspacesQueryKey) || [];
      const optimisticWorkspace = {
        _id: `optimistic-${Date.now()}`,
        name,
        description,
        members: [],
        updatedAt: new Date().toISOString(),
        isOptimistic: true,
      };
      queryClient.setQueryData(dashboardWorkspacesQueryKey, [
        ...previousWorkspaces,
        optimisticWorkspace,
      ]);
      return { previousWorkspaces };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousWorkspaces) {
        queryClient.setQueryData(
          dashboardWorkspacesQueryKey,
          context.previousWorkspaces,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardWorkspacesQueryKey });
    },
  });
  const workspaces = workspacesQuery.data || [];
  const loading = workspacesQuery.isPending;
  const error = workspacesQuery.error?.message || '';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    logoFile: null,
  });

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

    try {
      await createWorkspaceMutation.mutateAsync({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        logoFile: createForm.logoFile,
      });

      setIsCreateOpen(false);
      setCreateForm({ name: '', description: '', logoFile: null });
    } catch (err) {
      setCreateError(err.message || 'Something went wrong');
    }
  };

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

          {loading ? (
            <p className="empty-state dashboard-loading">Loading your workspaces...</p>
          ) : workspaces.length === 0 ? (
            <p className="empty-state">
              You are not part of any workspaces yet. Create a workspace or ask an
              administrator to invite you to one.
            </p>
          ) : (
            <div className="workspace-card-grid">
              {workspaces.map((workspace) => (
                <article
                  key={workspace._id}
                  className="workspace-card workspace-card-link"
                  role="link"
                  tabIndex={workspace.isOptimistic ? -1 : 0}
                  aria-busy={workspace.isOptimistic}
                  onClick={() => {
                    if (!workspace.isOptimistic) {
                      navigate(`/workspaces/${workspace._id}`);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (workspace.isOptimistic) return;
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
                    <span className="workspace-badge">Workspace</span>
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
          isSubmitting={createWorkspaceMutation.isPending}
          error={createError}
        />
      )}
    </main>
  );
}
