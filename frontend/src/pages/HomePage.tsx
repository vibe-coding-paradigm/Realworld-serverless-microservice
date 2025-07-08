import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center space-y-6">
        <div className="bg-primary text-primary-foreground py-16 px-8 rounded-lg">
          <h1 className="text-4xl font-bold mb-4">conduit</h1>
          <p className="text-xl">A place to share your knowledge.</p>
        </div>

        {user ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Welcome back, {user.username}!
            </h2>
            <p className="text-muted-foreground">
              Ready to share your thoughts with the world?
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Welcome to Conduit
            </h2>
            <p className="text-muted-foreground">
              Sign up to start sharing and reading amazing articles.
            </p>
          </div>
        )}

        <div className="bg-muted rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground">
            Article listing, creation, and commenting features are being developed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;