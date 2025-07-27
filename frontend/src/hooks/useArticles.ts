import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articlesAPI } from '@/lib/api';
import type { Article } from '@/types';

interface ArticlesParams {
  tag?: string;
  author?: string;
  favorited?: string;
  limit?: number;
  offset?: number;
}

interface ArticlesResponse {
  articles: Article[];
  articlesCount: number;
}

// Query keys
export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  list: (params: ArticlesParams) => [...articleKeys.lists(), params] as const,
  details: () => [...articleKeys.all, 'detail'] as const,
  detail: (slug: string) => [...articleKeys.details(), slug] as const,
};

// Get articles list
export function useArticles(params: ArticlesParams = {}) {
  return useQuery<ArticlesResponse>({
    queryKey: articleKeys.list(params),
    queryFn: () => articlesAPI.getArticles(params),
  });
}

// Get single article
export function useArticle(slug: string | undefined) {
  return useQuery<{ article: Article }>({
    queryKey: articleKeys.detail(slug || ''),
    queryFn: () => articlesAPI.getArticle(slug!),
    enabled: !!slug,
  });
}

// Create article mutation
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: articlesAPI.createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}

// Update article mutation
export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, article }: { slug: string; article: Parameters<typeof articlesAPI.updateArticle>[1] }) =>
      articlesAPI.updateArticle(slug, article),
    onSuccess: (_: any, variables: { slug: string; article: any }) => {
      queryClient.invalidateQueries({ queryKey: articleKeys.detail(variables.slug) });
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}

// Delete article mutation
export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: articlesAPI.deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
}