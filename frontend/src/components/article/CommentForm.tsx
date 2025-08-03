import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateComment } from '@/hooks/useComments';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

interface CommentFormProps {
  articleSlug: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({ articleSlug }) => {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const createCommentMutation = useCreateComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!body.trim()) {
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        slug: articleSlug,
        body: body.trim(),
      });
      setBody('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500 mb-2">
          <Link to={ROUTES.LOGIN} className="text-green-500">Sign in</Link> or{' '}
          <Link to={ROUTES.REGISTER} className="text-green-500">sign up</Link> to add comments on this article.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="comment-form mt-6">
      <div className="card">
        <div className="card-block p-4">
          <textarea 
            className="form-control w-full p-3 border rounded resize-none"
            placeholder="Write a comment..."
            name="body"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={createCommentMutation.isPending}
          ></textarea>
        </div>
        <div className="card-footer bg-gray-50 p-3 flex justify-between items-center">
          {user.image && (
            <img 
              src={user.image} 
              alt={user.username}
              className="w-8 h-8 rounded-full"
            />
          )}
          <button 
            type="submit" 
            className="btn-realworld btn-primary btn-sm"
            disabled={createCommentMutation.isPending || !body.trim()}
          >
            {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </div>
    </form>
  );
};