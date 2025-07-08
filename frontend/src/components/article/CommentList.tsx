import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteComment } from '@/hooks/useComments';
import type { Comment } from '@/types';

interface CommentListProps {
  comments: Comment[];
  articleSlug: string;
}

export const CommentList: React.FC<CommentListProps> = ({ comments, articleSlug }) => {
  const { user } = useAuth();
  const deleteCommentMutation = useDeleteComment();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteCommentMutation.mutateAsync({
        slug: articleSlug,
        id: commentId,
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No comments yet.</p>
      </div>
    );
  }

  return (
    <div className="comments-list">
      {comments.map((comment) => (
        <div key={comment.id} className="comment-card border rounded p-4 mb-4">
          <div className="comment-body mb-3">
            <p>{comment.body}</p>
          </div>
          <div className="comment-meta flex items-center justify-between">
            <div className="flex items-center">
              {comment.author.image && (
                <img 
                  src={comment.author.image} 
                  alt={comment.author.username}
                  className="w-6 h-6 rounded-full mr-2"
                />
              )}
              <Link 
                to={`/profile/${comment.author.username}`}
                className="text-green-500 font-medium mr-2"
              >
                {comment.author.username}
              </Link>
              <span className="text-gray-500 text-sm">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            
            {user && user.username === comment.author.username && (
              <button 
                className="text-red-500 text-sm hover:text-red-700"
                onClick={() => handleDeleteComment(comment.id)}
                disabled={deleteCommentMutation.isPending}
              >
                <i className="ion-trash-a"></i>
                {deleteCommentMutation.isPending ? ' Deleting...' : ''}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};