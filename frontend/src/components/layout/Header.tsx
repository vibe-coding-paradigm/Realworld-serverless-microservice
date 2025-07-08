import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary">
            conduit
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <Link 
              to="/" 
              className="text-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>

            {user ? (
              // Authenticated user navigation
              <>
                <Link 
                  to="/editor" 
                  className="text-foreground hover:text-primary transition-colors flex items-center space-x-1"
                >
                  <span>New Article</span>
                </Link>

                <Link 
                  to="/settings" 
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Settings
                </Link>

                <Link 
                  to={`/profile/${user.username}`} 
                  className="text-foreground hover:text-primary transition-colors flex items-center space-x-2"
                >
                  {user.image && (
                    <img 
                      src={user.image} 
                      alt={user.username} 
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span>{user.username}</span>
                </Link>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                >
                  Sign out
                </Button>
              </>
            ) : (
              // Guest navigation
              <>
                <Link 
                  to="/login" 
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Sign in
                </Link>

                <Link to="/register">
                  <Button variant="outline" size="sm">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;