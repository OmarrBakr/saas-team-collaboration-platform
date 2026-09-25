import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../context/AuthContext';
import { getWorkspace, getWorkspaceBoards } from '../services/workspaces';

export const workspaceQueryKey = (workspaceId) => ['workspace', workspaceId];
export const workspaceBoardsQueryKey = (workspaceId) => ['workspace-boards', workspaceId];

const idOf = (member) => member?.user?._id || member?.user?.id || member?.user;
const rolesOf = (members) => Object.fromEntries(
  members.map((member) => [idOf(member)?.toString?.(), member.role])
);

export default function useWorkspaceData(workspaceId, { includeBoards = true } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localError, setLocalError] = useState('');
  const [draftMemberRoles, setDraftMemberRoles] = useState({});

  const workspaceQuery = useQuery({
    queryKey: workspaceQueryKey(workspaceId),
    queryFn: async () => (await getWorkspace(workspaceId)).workspace,
    enabled: Boolean(workspaceId && user),
  });
  const boardsQuery = useQuery({
    queryKey: workspaceBoardsQueryKey(workspaceId),
    queryFn: async () => (await getWorkspaceBoards(workspaceId)).boards || [],
    enabled: Boolean(workspaceId && user && includeBoards),
  });

  const setWorkspace = useCallback((updater) => {
    queryClient.setQueryData(workspaceQueryKey(workspaceId), (current) =>
      typeof updater === 'function' ? updater(current) : updater
    );
  }, [queryClient, workspaceId]);
  const setBoards = useCallback((updater) => {
    queryClient.setQueryData(workspaceBoardsQueryKey(workspaceId), (current = []) =>
      typeof updater === 'function' ? updater(current) : updater
    );
  }, [queryClient, workspaceId]);

  const workspace = workspaceQuery.data || null;
  const members = workspace?.members || [];
  const invitations = workspace?.invitations || [];
  const boards = includeBoards ? boardsQuery.data || [] : [];
  const memberRoles = useMemo(() => rolesOf(members), [members]);
  const userId = user?._id || user?.id;
  const email = user?.email?.toLowerCase?.();
  const currentMember = members.find((member) =>
    idOf(member)?.toString?.() === userId?.toString?.() ||
    (email && member.user?.email?.toLowerCase?.() === email)
  );
  const adminCount = members.filter((member) => member.role === 'admin').length;

  return {
    workspace,
    setWorkspace,
    boards,
    setBoards,
    members,
    invitations,
    memberRoles,
    draftMemberRoles,
    setDraftMemberRoles,
    loading: workspaceQuery.isPending || (includeBoards && boardsQuery.isPending),
    workspaceLoading: workspaceQuery.isPending,
    boardsLoading: includeBoards && boardsQuery.isPending,
    refreshing: workspaceQuery.isFetching || (includeBoards && boardsQuery.isFetching),
    error: localError || workspaceQuery.error?.message || boardsQuery.error?.message || '',
    setError: setLocalError,
    currentMember,
    currentMemberId: idOf(currentMember),
    isAdmin: currentMember?.role === 'admin',
    isOnlyAdmin: currentMember?.role === 'admin' && adminCount === 1,
  };
}
