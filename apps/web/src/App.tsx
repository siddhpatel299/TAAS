import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LoginPage } from '@/pages/LoginPage';
import { ModernDashboardPage } from '@/pages/ModernDashboardPage';
import { MyFilesPage } from '@/pages/MyFilesPage';
import { TelegramChatsPage } from '@/pages/TelegramChatsPage';
import { StarredPage } from '@/pages/StarredPage';
import { TrashPage } from '@/pages/TrashPage';
import { SharePage } from '@/pages/SharePage';
import { PluginsPage } from '@/pages/PluginsPage';
import { JobTrackerDashboardPage } from '@/pages/JobTrackerDashboardPage';
import { JobApplicationsPage } from '@/pages/JobApplicationsPage';
import { JobApplicationFormPage } from '@/pages/JobApplicationFormPage';
import { TodoPage } from '@/pages/TodoPage';
import { PluginComingSoonPage } from '@/pages/PluginComingSoonPage';
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage';
import { useAuthStore } from '@/stores/auth.store';
import { usePluginsStore } from '@/stores/plugins.store';
import { authApi } from '@/lib/api';
import { Send } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Subtle ambient lighting */}
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-2xl p-12 flex flex-col items-center gap-6 luxury-border"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-xl bg-foreground flex items-center justify-center shadow-lg"
          >
            <Send className="w-8 h-8 text-background" />
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground/90 text-luxury">Loading TAAS</p>
            <p className="text-sm text-foreground/50">Preparing your files...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthCheck({ children }: { children: React.ReactNode }) {
  const { token, setUser, setLoading, logout } = useAuthStore();
  const { fetchEnabledPlugins } = usePluginsStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        setUser(response.data.data);
        // Fetch enabled plugins after authentication
        fetchEnabledPlugins();
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthCheck>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ModernDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/files"
                element={
                  <ProtectedRoute>
                    <MyFilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/telegram"
                element={
                  <ProtectedRoute>
                    <TelegramChatsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/starred"
                element={
                  <ProtectedRoute>
                    <StarredPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trash"
                element={
                  <ProtectedRoute>
                    <TrashPage />
                  </ProtectedRoute>
                }
              />
              {/* Plugin Routes */}
              <Route
                path="/plugins"
                element={
                  <ProtectedRoute>
                    <PluginsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plugins/todo-lists"
                element={
                  <ProtectedRoute>
                    <TodoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plugins/job-tracker"
                element={
                  <ProtectedRoute>
                    <JobTrackerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plugins/job-tracker/applications"
                element={
                  <ProtectedRoute>
                    <JobApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plugins/job-tracker/applications/:id"
                element={
                  <ProtectedRoute>
                    <JobApplicationFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plugins/:pluginId"
                element={
                  <ProtectedRoute>
                    <PluginComingSoonPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/share/:token" element={<SharePage />} />
              <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthCheck>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
