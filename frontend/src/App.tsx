import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { queryClient } from '@/lib/query-client';
import { ROUTES } from '@/lib/routes';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ArticlePage from '@/pages/ArticlePage';
import EditorPage from '@/pages/EditorPage';

function App() {
  // 환경에 따른 basename 설정
  const isProduction = import.meta.env.PROD;
  const isGitHubPages = window.location.hostname.includes('github.io');
  const basename = isProduction && isGitHubPages ? '/Realworld-serverless-microservice' : '';
  
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router basename={basename}>
          <Layout>
            <Routes>
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
              <Route path={ROUTES.ARTICLE_DETAIL} element={<ArticlePage />} />
              <Route path={ROUTES.EDITOR} element={<EditorPage />} />
              <Route path={ROUTES.EDITOR_EDIT} element={<EditorPage />} />
              {/* TODO: 아래 라우트들은 아직 구현되지 않음 */}
              {/* <Route path={ROUTES.SETTINGS} element={<SettingsPage />} /> */}
              {/* <Route path={ROUTES.PROFILE} element={<ProfilePage />} /> */}
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;