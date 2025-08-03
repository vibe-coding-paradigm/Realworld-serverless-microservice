import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useArticle, useDeleteArticle } from '@/hooks/useArticles';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { CommentForm } from '@/components/article/CommentForm';
import { CommentList } from '@/components/article/CommentList';
import { ROUTES, createRoutes } from '@/lib/routes';

const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: articleData, isLoading: articleLoading, error: articleError } = useArticle(slug);
  const { data: commentsData, isLoading: commentsLoading } = useComments(slug);
  const deleteArticleMutation = useDeleteArticle();

  const article = articleData?.article;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDeleteArticle = async () => {
    if (!article || !window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await deleteArticleMutation.mutateAsync(article.slug);
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const isAuthor = user && article && user.username === article.author.username;

  if (articleLoading) {
    return (
      <div className="article-page">
        <div className="realworld-container" style={{ padding: '2rem 15px' }}>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (articleError || !article) {
    return (
      <div className="article-page">
        <div className="realworld-container" style={{ padding: '2rem 15px' }}>
          <div className="text-center py-8">
            <p className="text-red-500">Article not found.</p>
            <Link to={ROUTES.HOME} className="btn-realworld btn-outline-primary mt-4">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="article-page">
      {/* Article Banner */}
      <div className="banner" style={{ backgroundColor: '#333', color: 'white', padding: '2rem 0' }}>
        <div className="realworld-container">
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          
          <div className="article-meta flex items-center">
            <Link to={createRoutes.profile(article.author.username)} className="author">
              {article.author.image && (
                <img 
                  src={article.author.image} 
                  alt={article.author.username}
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
            </Link>
            <div className="info mr-auto">
              <Link to={createRoutes.profile(article.author.username)} className="author text-white">
                {article.author.username}
              </Link>
              <span className="date block text-gray-300 text-sm">
                {formatDate(article.createdAt)}
              </span>
            </div>
            
            {isAuthor && (
              <div className="flex gap-2">
                <Link 
                  to={createRoutes.editorEdit(article.slug)}
                  className="btn-realworld btn-outline-primary text-white border-white hover:bg-white hover:text-gray-800"
                >
                  <i className="ion-edit mr-1"></i>
                  Edit Article
                </Link>
                <button 
                  onClick={handleDeleteArticle}
                  disabled={deleteArticleMutation.isPending}
                  className="btn-realworld btn-outline-primary text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                >
                  <i className="ion-trash-a mr-1"></i>
                  {deleteArticleMutation.isPending ? 'Deleting...' : 'Delete Article'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="realworld-container" style={{ padding: '2rem 15px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="article-content">
            <p className="lead text-lg text-gray-600 mb-6">{article.description}</p>
            <div className="prose prose-lg max-w-none">
              {article.body.split('\n').map((paragraph: string, index: number) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Tags */}
          {article.tagList && article.tagList.length > 0 && (
            <div className="article-tags mt-8 pt-4 border-t">
              <ul className="tag-list">
                {article.tagList.map((tag: string, index: number) => (
                  <li key={index} className="tag-default tag-pill">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="realworld-container" style={{ padding: '2rem 15px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="comments-section">
            <h3 className="text-xl font-semibold mb-4">
              Comments ({commentsData?.comments?.length || 0})
            </h3>
            
            {commentsLoading && (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading comments...</p>
              </div>
            )}

            {commentsData && commentsData.comments && (
              <CommentList 
                comments={commentsData.comments} 
                articleSlug={article.slug} 
              />
            )}

            {/* Comment Form */}
            <CommentForm articleSlug={article.slug} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePage;