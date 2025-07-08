import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsAPI } from '@/lib/api';
import type { Comment } from '@/types';

interface CommentsResponse {
  comments: Comment[];
}

// Query keys
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (slug: string) => [...commentKeys.lists(), slug] as const,
};

// Get comments for an article
export function useComments(slug: string | undefined) {
  return useQuery<CommentsResponse>({
    queryKey: commentKeys.list(slug || ''),
    queryFn: () => commentsAPI.getComments(slug!),
    enabled: !!slug,
  });
}

// Create comment mutation
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, body }: { slug: string; body: string }) =>
      commentsAPI.createComment(slug, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(variables.slug) });
    },
  });
}

// Delete comment mutation
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, id }: { slug: string; id: string }) =>
      commentsAPI.deleteComment(slug, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(variables.slug) });
    },
  });
}