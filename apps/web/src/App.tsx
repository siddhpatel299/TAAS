import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DirectUploadProvider } from '@/contexts/DirectUploadContext';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
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
import { OutreachPage } from '@/pages/OutreachPage';
import { ContactFinderPage } from '@/pages/ContactFinderPage';
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

import { VersionProvider, useVersion } from '@/contexts/VersionContext';
import { WarZoneLayout } from '@/layouts/WarZoneLayout';
import { WarZoneDashboardPage } from '@/pages/war-zone/WarZoneDashboardPage';
import { WarZoneFilesPage } from '@/pages/war-zone/WarZoneFilesPage';
import { WarZoneStarredPage } from '@/pages/war-zone/WarZoneStarredPage';
import { HUDDashboardPage } from '@/pages/hud/HUDDashboardPage';
import { HUDFilesPage } from '@/pages/hud/HUDFilesPage';
import { HUDJobTrackerPage } from '@/pages/hud/HUDJobTrackerPage';
import { HUDStarredPage } from '@/pages/hud/HUDStarredPage';
import { HUDPluginsPage } from '@/pages/hud/HUDPluginsPage';
import { HUDTrashPage } from '@/pages/hud/HUDTrashPage';
import { HUDTodoPage } from '@/pages/hud/HUDTodoPage';
import { HUDJobApplicationsPage } from '@/pages/hud/HUDJobApplicationsPage';
import { HUDOutreachPage } from '@/pages/hud/HUDOutreachPage';
import { HUDContactFinderPage } from '@/pages/hud/HUDContactFinderPage';

// ... (existing imports remain the same)

function AppContent() {
  const { version } = useVersion();

  // HUD Theme
  if (version === 'hud') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><HUDDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><HUDFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><TelegramChatsPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><HUDStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><HUDTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><HUDPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><HUDTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><HUDJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><HUDJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><JobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><HUDOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><HUDContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // War Zone Theme
  if (version === 'war-zone') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <WarZoneLayout>
            <Routes>
              <Route path="/" element={<WarZoneDashboardPage />} />
              <Route path="/files" element={<WarZoneFilesPage />} />
              <Route path="/starred" element={<WarZoneStarredPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WarZoneLayout>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  return (
    <AuthCheck>
      <DirectUploadProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
            path="/plugins/job-tracker/outreach"
            element={
              <ProtectedRoute>
                <OutreachPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plugins/job-tracker/contacts"
            element={
              <ProtectedRoute>
                <ContactFinderPage />
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
      </DirectUploadProvider>
    </AuthCheck>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VersionProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </VersionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
