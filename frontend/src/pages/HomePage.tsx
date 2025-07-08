import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { user } = useAuth();

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
                    <a 
                      className="nav-link active" 
                      href="#" 
                      style={{ 
                        color: '#5cb85c', 
                        borderBottom: '2px solid #5cb85c',
                        padding: '0.75rem 1rem',
                        display: 'block',
                        textDecoration: 'none'
                      }}
                    >
                      Your Feed
                    </a>
                  </li>
                )}
                <li className="nav-item">
                  <a 
                    className="nav-link" 
                    href="#"
                    style={{ 
                      color: '#aaa', 
                      padding: '0.75rem 1rem',
                      display: 'block',
                      textDecoration: 'none'
                    }}
                  >
                    Global Feed
                  </a>
                </li>
              </ul>
            </div>

            {/* Coming Soon Message */}
            <div className="text-center py-12 text-gray-500">
              <h3 className="text-xl font-semibold mb-4">Articles Coming Soon!</h3>
              <p>We're working hard to bring you the complete article reading experience.</p>
              <p className="mt-2">Stay tuned for updates!</p>
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