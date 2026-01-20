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
import { HUDTelegramPage } from '@/pages/hud/HUDTelegramPage';
import { HUDJobApplicationFormPage } from '@/pages/hud/HUDJobApplicationFormPage';

// Forest Theme imports
import { ForestDashboardPage } from '@/pages/forest/ForestDashboardPage';
import { ForestFilesPage } from '@/pages/forest/ForestFilesPage';
import { ForestStarredPage } from '@/pages/forest/ForestStarredPage';
import { ForestTrashPage } from '@/pages/forest/ForestTrashPage';
import { ForestPluginsPage } from '@/pages/forest/ForestPluginsPage';
import { ForestTodoPage } from '@/pages/forest/ForestTodoPage';
import { ForestJobTrackerPage } from '@/pages/forest/ForestJobTrackerPage';
import { ForestJobApplicationsPage } from '@/pages/forest/ForestJobApplicationsPage';
import { ForestJobApplicationFormPage } from '@/pages/forest/ForestJobApplicationFormPage';
import { ForestOutreachPage } from '@/pages/forest/ForestOutreachPage';
import { ForestContactFinderPage } from '@/pages/forest/ForestContactFinderPage';
import { ForestTelegramPage } from '@/pages/forest/ForestTelegramPage';

// Terminal Theme imports
import { TerminalDashboardPage } from '@/pages/terminal/TerminalDashboardPage';
import { TerminalFilesPage } from '@/pages/terminal/TerminalFilesPage';
import { TerminalStarredPage } from '@/pages/terminal/TerminalStarredPage';
import { TerminalTrashPage } from '@/pages/terminal/TerminalTrashPage';
import { TerminalPluginsPage } from '@/pages/terminal/TerminalPluginsPage';
import { TerminalTodoPage } from '@/pages/terminal/TerminalTodoPage';
import { TerminalJobTrackerPage } from '@/pages/terminal/TerminalJobTrackerPage';
import { TerminalJobApplicationsPage } from '@/pages/terminal/TerminalJobApplicationsPage';
import { TerminalJobApplicationFormPage } from '@/pages/terminal/TerminalJobApplicationFormPage';
import { TerminalOutreachPage } from '@/pages/terminal/TerminalOutreachPage';
import { TerminalContactFinderPage } from '@/pages/terminal/TerminalContactFinderPage';
import { TerminalTelegramPage } from '@/pages/terminal/TerminalTelegramPage';

// Origami Theme imports
import { OrigamiDashboardPage } from '@/pages/origami/OrigamiDashboardPage';
import { OrigamiFilesPage } from '@/pages/origami/OrigamiFilesPage';
import { OrigamiStarredPage } from '@/pages/origami/OrigamiStarredPage';
import { OrigamiTrashPage } from '@/pages/origami/OrigamiTrashPage';
import { OrigamiPluginsPage } from '@/pages/origami/OrigamiPluginsPage';
import { OrigamiTodoPage } from '@/pages/origami/OrigamiTodoPage';
import { OrigamiJobTrackerPage } from '@/pages/origami/OrigamiJobTrackerPage';
import { OrigamiJobApplicationsPage } from '@/pages/origami/OrigamiJobApplicationsPage';
import { OrigamiJobApplicationFormPage } from '@/pages/origami/OrigamiJobApplicationFormPage';
import { OrigamiOutreachPage } from '@/pages/origami/OrigamiOutreachPage';
import { OrigamiContactFinderPage } from '@/pages/origami/OrigamiContactFinderPage';
import { OrigamiTelegramPage } from '@/pages/origami/OrigamiTelegramPage';

// Blueprint Theme imports
import { BlueprintDashboardPage } from '@/pages/blueprint/BlueprintDashboardPage';
import { BlueprintFilesPage } from '@/pages/blueprint/BlueprintFilesPage';
import { BlueprintStarredPage } from '@/pages/blueprint/BlueprintStarredPage';
import { BlueprintTrashPage } from '@/pages/blueprint/BlueprintTrashPage';
import { BlueprintPluginsPage } from '@/pages/blueprint/BlueprintPluginsPage';
import { BlueprintTodoPage } from '@/pages/blueprint/BlueprintTodoPage';
import { BlueprintJobTrackerPage } from '@/pages/blueprint/BlueprintJobTrackerPage';
import { BlueprintJobApplicationsPage } from '@/pages/blueprint/BlueprintJobApplicationsPage';
import { BlueprintJobApplicationFormPage } from '@/pages/blueprint/BlueprintJobApplicationFormPage';
import { BlueprintOutreachPage } from '@/pages/blueprint/BlueprintOutreachPage';
import { BlueprintContactFinderPage } from '@/pages/blueprint/BlueprintContactFinderPage';
import { BlueprintTelegramPage } from '@/pages/blueprint/BlueprintTelegramPage';

// Newsprint Theme imports
import { NewsprintDashboardPage } from '@/pages/newsprint/NewsprintDashboardPage';
import { NewsprintFilesPage } from '@/pages/newsprint/NewsprintFilesPage';
import { NewsprintStarredPage } from '@/pages/newsprint/NewsprintStarredPage';
import { NewsprintTrashPage } from '@/pages/newsprint/NewsprintTrashPage';
import { NewsprintPluginsPage } from '@/pages/newsprint/NewsprintPluginsPage';
import { NewsprintTodoPage } from '@/pages/newsprint/NewsprintTodoPage';
import { NewsprintJobTrackerPage } from '@/pages/newsprint/NewsprintJobTrackerPage';
import { NewsprintJobApplicationsPage } from '@/pages/newsprint/NewsprintJobApplicationsPage';
import { NewsprintJobApplicationFormPage } from '@/pages/newsprint/NewsprintJobApplicationFormPage';
import { NewsprintOutreachPage } from '@/pages/newsprint/NewsprintOutreachPage';
import { NewsprintContactFinderPage } from '@/pages/newsprint/NewsprintContactFinderPage';
import { NewsprintTelegramPage } from '@/pages/newsprint/NewsprintTelegramPage';

// Brutalist Theme imports
import { BrutalistDashboardPage } from '@/pages/brutalist/BrutalistDashboardPage';
import { BrutalistFilesPage } from '@/pages/brutalist/BrutalistFilesPage';
import { BrutalistStarredPage } from '@/pages/brutalist/BrutalistStarredPage';
import { BrutalistTrashPage } from '@/pages/brutalist/BrutalistTrashPage';
import { BrutalistPluginsPage } from '@/pages/brutalist/BrutalistPluginsPage';
import { BrutalistTodoPage } from '@/pages/brutalist/BrutalistTodoPage';
import { BrutalistJobTrackerPage } from '@/pages/brutalist/BrutalistJobTrackerPage';
import { BrutalistJobApplicationsPage } from '@/pages/brutalist/BrutalistJobApplicationsPage';
import { BrutalistJobApplicationFormPage } from '@/pages/brutalist/BrutalistJobApplicationFormPage';
import { BrutalistOutreachPage } from '@/pages/brutalist/BrutalistOutreachPage';
import { BrutalistContactFinderPage } from '@/pages/brutalist/BrutalistContactFinderPage';
import { BrutalistTelegramPage } from '@/pages/brutalist/BrutalistTelegramPage';

// CRT Theme imports
import { CRTDashboardPage } from '@/pages/crt/CRTDashboardPage';
import { CRTFilesPage } from '@/pages/crt/CRTFilesPage';
import { CRTStarredPage } from '@/pages/crt/CRTStarredPage';
import { CRTTrashPage } from '@/pages/crt/CRTTrashPage';
import { CRTPluginsPage } from '@/pages/crt/CRTPluginsPage';
import { CRTTodoPage } from '@/pages/crt/CRTTodoPage';
import { CRTJobTrackerPage } from '@/pages/crt/CRTJobTrackerPage';
import { CRTJobApplicationsPage } from '@/pages/crt/CRTJobApplicationsPage';
import { CRTJobApplicationFormPage } from '@/pages/crt/CRTJobApplicationFormPage';
import { CRTOutreachPage } from '@/pages/crt/CRTOutreachPage';
import { CRTContactFinderPage } from '@/pages/crt/CRTContactFinderPage';
import { CRTTelegramPage } from '@/pages/crt/CRTTelegramPage';

// Glass Theme imports
import { GlassDashboardPage } from '@/pages/glass/GlassDashboardPage';
import { GlassFilesPage } from '@/pages/glass/GlassFilesPage';
import { GlassStarredPage } from '@/pages/glass/GlassStarredPage';
import { GlassTrashPage } from '@/pages/glass/GlassTrashPage';
import { GlassPluginsPage } from '@/pages/glass/GlassPluginsPage';
import { GlassTodoPage } from '@/pages/glass/GlassTodoPage';
import { GlassJobTrackerPage } from '@/pages/glass/GlassJobTrackerPage';
import { GlassJobApplicationsPage } from '@/pages/glass/GlassJobApplicationsPage';
import { GlassJobApplicationFormPage } from '@/pages/glass/GlassJobApplicationFormPage';
import { GlassOutreachPage } from '@/pages/glass/GlassOutreachPage';
import { GlassContactFinderPage } from '@/pages/glass/GlassContactFinderPage';
import { GlassTelegramPage } from '@/pages/glass/GlassTelegramPage';

// Art Deco Theme imports
import { ArtDecoDashboardPage } from '@/pages/artdeco/ArtDecoDashboardPage';
import { ArtDecoFilesPage } from '@/pages/artdeco/ArtDecoFilesPage';
import { ArtDecoStarredPage } from '@/pages/artdeco/ArtDecoStarredPage';
import { ArtDecoTrashPage } from '@/pages/artdeco/ArtDecoTrashPage';
import { ArtDecoPluginsPage } from '@/pages/artdeco/ArtDecoPluginsPage';
import { ArtDecoTodoPage } from '@/pages/artdeco/ArtDecoTodoPage';
import { ArtDecoJobTrackerPage } from '@/pages/artdeco/ArtDecoJobTrackerPage';
import { ArtDecoJobApplicationsPage } from '@/pages/artdeco/ArtDecoJobApplicationsPage';
import { ArtDecoJobApplicationFormPage } from '@/pages/artdeco/ArtDecoJobApplicationFormPage';
import { ArtDecoOutreachPage } from '@/pages/artdeco/ArtDecoOutreachPage';
import { ArtDecoContactFinderPage } from '@/pages/artdeco/ArtDecoContactFinderPage';
import { ArtDecoTelegramPage } from '@/pages/artdeco/ArtDecoTelegramPage';

// Canvas/Museumcore Theme imports
import { CanvasDashboardPage } from '@/pages/canvas/CanvasDashboardPage';
import { CanvasFilesPage } from '@/pages/canvas/CanvasFilesPage';
import { CanvasStarredPage } from '@/pages/canvas/CanvasStarredPage';
import { CanvasTrashPage } from '@/pages/canvas/CanvasTrashPage';
import { CanvasPluginsPage } from '@/pages/canvas/CanvasPluginsPage';
import { CanvasTodoPage } from '@/pages/canvas/CanvasTodoPage';
import { CanvasJobTrackerPage } from '@/pages/canvas/CanvasJobTrackerPage';
import { CanvasJobApplicationsPage } from '@/pages/canvas/CanvasJobApplicationsPage';
import { CanvasJobApplicationFormPage } from '@/pages/canvas/CanvasJobApplicationFormPage';
import { CanvasOutreachPage } from '@/pages/canvas/CanvasOutreachPage';
import { CanvasContactFinderPage } from '@/pages/canvas/CanvasContactFinderPage';
import { CanvasTelegramPage } from '@/pages/canvas/CanvasTelegramPage';

// ... (existing imports remain the same)

function AppContent() {
  const { version } = useVersion();

  // Newsprint Theme
  if (version === 'newsprint') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><NewsprintDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><NewsprintFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><NewsprintTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><NewsprintStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><NewsprintTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><NewsprintPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><NewsprintTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><NewsprintJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><NewsprintJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><NewsprintJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><NewsprintOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><NewsprintContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Brutalist Theme
  if (version === 'brutalist') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><BrutalistDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><BrutalistFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><BrutalistTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><BrutalistStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><BrutalistTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><BrutalistPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><BrutalistTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><BrutalistJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><BrutalistJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><BrutalistJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><BrutalistOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><BrutalistContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // CRT Theme
  if (version === 'crt') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><CRTDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><CRTFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><CRTTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><CRTStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><CRTTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><CRTPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><CRTTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><CRTJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><CRTJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><CRTJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><CRTOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><CRTContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Glass Theme
  if (version === 'glass') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><GlassDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><GlassFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><GlassTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><GlassStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><GlassTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><GlassPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><GlassTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><GlassJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><GlassJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><GlassJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><GlassOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><GlassContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Art Deco Theme
  if (version === 'artdeco') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><ArtDecoDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><ArtDecoFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><ArtDecoTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><ArtDecoStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><ArtDecoTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><ArtDecoPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><ArtDecoTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><ArtDecoJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><ArtDecoJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><ArtDecoJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><ArtDecoOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><ArtDecoContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Canvas/Museumcore Theme
  if (version === 'canvas') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><CanvasDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><CanvasFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><CanvasTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><CanvasStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><CanvasTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><CanvasPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><CanvasTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><CanvasJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><CanvasJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><CanvasJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><CanvasOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><CanvasContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Blueprint Theme
  if (version === 'blueprint') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><BlueprintDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><BlueprintFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><BlueprintTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><BlueprintStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><BlueprintTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><BlueprintPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><BlueprintTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><BlueprintJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><BlueprintJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><BlueprintJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><BlueprintOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><BlueprintContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Origami Theme
  if (version === 'origami') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><OrigamiDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><OrigamiFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><OrigamiTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><OrigamiStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><OrigamiTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><OrigamiPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><OrigamiTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><OrigamiJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><OrigamiJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><OrigamiJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><OrigamiOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><OrigamiContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Forest Theme
  if (version === 'forest') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><ForestDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><ForestFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><ForestTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><ForestStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><ForestTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><ForestPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><ForestTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><ForestJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><ForestJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><ForestJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><ForestOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><ForestContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Terminal Theme
  if (version === 'terminal') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><TerminalDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><TerminalFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><TerminalTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><TerminalStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><TerminalTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><TerminalPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><TerminalTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><TerminalJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><TerminalJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><TerminalJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><TerminalOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><TerminalContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

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
            <Route path="/telegram" element={<ProtectedRoute><HUDTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><HUDStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><HUDTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><HUDPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><HUDTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><HUDJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><HUDJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><HUDJobApplicationFormPage /></ProtectedRoute>} />
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
