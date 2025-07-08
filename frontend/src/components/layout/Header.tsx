import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar-light" style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e5e5' }}>
      <div className="realworld-container">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="navbar-brand logo-font" style={{ color: '#5cb85c', fontSize: '1.5rem', fontWeight: 700, textDecoration: 'none' }}>
            conduit
          </Link>

          {/* Navigation */}
          <ul className="flex items-center space-x-4 list-none m-0">
            <li>
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>

            {user ? (
              // Authenticated user navigation
              <>
                <li>
                  <Link to="/editor" className="nav-link">
                    <i className="ion-compose mr-1"></i>
                    New Article
                  </Link>
                </li>

                <li>
                  <Link to="/settings" className="nav-link">
                    <i className="ion-gear-a mr-1"></i>
                    Settings
                  </Link>
                </li>

                <li>
                  <Link to={`/profile/${user.username}`} className="nav-link">
                    {user.image && (
                      <img 
                        src={user.image} 
                        alt={user.username} 
                        className="inline-block w-6 h-6 rounded-full mr-1"
                      />
                    )}
                    {user.username}
                  </Link>
                </li>

                <li>
                  <button 
                    onClick={handleLogout}
                    className="nav-link border-0 bg-transparent cursor-pointer"
                  >
                    Sign out
                  </button>
                </li>
              </>
            ) : (
              // Guest navigation
              <>
                <li>
                  <Link to="/login" className="nav-link">
                    Sign in
                  </Link>
                </li>

                <li>
                  <Link to="/register" className="nav-link">
                    Sign up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;