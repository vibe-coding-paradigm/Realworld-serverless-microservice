import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useArticles } from '@/hooks/useArticles';
import { ArticleCard } from '@/components/article/ArticleCard';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'personal'>('global');
  
  const { data: articlesData, isLoading, error } = useArticles({
    limit: 10,
    offset: 0,
  });

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="realworld-hero">
        <div className="realworld-container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="realworld-container" style={{ padding: '2rem 15px' }}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed Area */}
          <div className="flex-1">
            {user ? (
              <div className="mb-8">
                <div className="text-center py-8">
                  <h2 className="text-2xl font-semibold mb-4">
                    Welcome back, {user.username}!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Ready to share your thoughts with the world?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/editor" className="btn-realworld btn-primary">
                      Write an Article
                    </Link>
                    <Link to="/articles" className="btn-realworld btn-outline-primary">
                      Browse Articles
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <div className="text-center py-8">
                  <h2 className="text-2xl font-semibold mb-4">
                    Welcome to Conduit
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Join our community of writers and readers. Share your knowledge and discover new perspectives.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/register" className="btn-realworld btn-primary">
                      Get Started
                    </Link>
                    <Link to="/login" className="btn-realworld btn-outline-primary">
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Feed Tabs */}
            <div className="feed-toggle mb-6">
              <ul className="nav nav-pills outline-active flex border-b border-gray-200">
                {user && (
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`}
                      onClick={() => setActiveTab('personal')}
                      style={{ 
                        color: activeTab === 'personal' ? '#5cb85c' : '#aaa', 
                        borderBottom: activeTab === 'personal' ? '2px solid #5cb85c' : 'none',
                        padding: '0.75rem 1rem',
                        display: 'block',
                        textDecoration: 'none',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Your Feed
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'global' ? 'active' : ''}`}
                    onClick={() => setActiveTab('global')}
                    style={{ 
                      color: activeTab === 'global' ? '#5cb85c' : '#aaa', 
                      borderBottom: activeTab === 'global' ? '2px solid #5cb85c' : 'none',
                      padding: '0.75rem 1rem',
                      display: 'block',
                      textDecoration: 'none',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Global Feed
                  </button>
                </li>
              </ul>
            </div>

            {/* Articles List */}
            <div className="articles-container">
              {isLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading articles...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-red-500">Error loading articles. Please try again.</p>
                </div>
              )}

              {articlesData && articlesData.articles.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No articles are here... yet.</p>
                </div>
              )}

              {articlesData && articlesData.articles.length > 0 && (
                <div className="articles-list">
                  {articlesData.articles.map((article: any) => (
                    <ArticleCard key={article.slug} article={article} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80">
            <div className="sidebar">
              <p className="text-sm text-gray-600 mb-3">Popular Tags</p>
              
              <div className="tag-list" style={{ backgroundColor: '#f3f3f3', padding: '0.75rem', borderRadius: '0.25rem' }}>
                <div className="text-center text-gray-500 py-4">
                  <p>Tags will appear here as articles are added.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;