import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../context/AuthContext';
import { getBoard } from '../services/boards';
import { getWorkspace } from '../services/workspaces';

export const boardQueryKey = (workspaceId, boardId) => ['board', workspaceId, boardId];
export const workspaceQueryKey = (workspaceId) => ['workspace', workspaceId];

export default function useBoardData(workspaceId, boardId) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localError, setLocalError] = useState('');
  const enabled = Boolean(workspaceId && boardId && user);

  const boardQuery = useQuery({
    queryKey: boardQueryKey(workspaceId, boardId),
    queryFn: async () => (await getBoard(workspaceId, boardId)).board,
    enabled,
  });

  const workspaceQuery = useQuery({
    queryKey: workspaceQueryKey(workspaceId),
    queryFn: async () => (await getWorkspace(workspaceId)).workspace,
    enabled: Boolean(workspaceId && user),
  });

  const setBoard = useCallback((updater) => {
    queryClient.setQueryData(boardQueryKey(workspaceId, boardId), (currentBoard) =>
      typeof updater === 'function' ? updater(currentBoard) : updater
    );
  }, [boardId, queryClient, workspaceId]);

  const workspaceMembers = workspaceQuery.data?.members || [];
  const currentUserId = user?.id || user?._id || '';
  const isAdmin = useMemo(() => {
    const member = workspaceMembers.find((entry) => {
      const id = entry.user?._id || entry.user?.id || entry.user;
      return id?.toString?.() === currentUserId?.toString?.();
    });
    return member?.role === 'admin';
  }, [currentUserId, workspaceMembers]);

  return {
    board: boardQuery.data || null,
    setBoard,
    loading: boardQuery.isPending || workspaceQuery.isPending,
    error: localError || boardQuery.error?.message || workspaceQuery.error?.message || '',
    setError: setLocalError,
    workspaceMembers,
    isAdmin,
  };
}
