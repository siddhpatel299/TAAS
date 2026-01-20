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

// Comic Book Theme imports
import { ComicDashboardPage } from '@/pages/comic/ComicDashboardPage';
import { ComicFilesPage } from '@/pages/comic/ComicFilesPage';
import { ComicStarredPage } from '@/pages/comic/ComicStarredPage';
import { ComicTrashPage } from '@/pages/comic/ComicTrashPage';
import { ComicPluginsPage } from '@/pages/comic/ComicPluginsPage';
import { ComicTodoPage } from '@/pages/comic/ComicTodoPage';
import { ComicJobTrackerPage } from '@/pages/comic/ComicJobTrackerPage';
import { ComicJobApplicationsPage } from '@/pages/comic/ComicJobApplicationsPage';
import { ComicJobApplicationFormPage } from '@/pages/comic/ComicJobApplicationFormPage';
import { ComicOutreachPage } from '@/pages/comic/ComicOutreachPage';
import { ComicContactFinderPage } from '@/pages/comic/ComicContactFinderPage';
import { ComicTelegramPage } from '@/pages/comic/ComicTelegramPage';

// Archival Index Theme imports
import { ArchiveDashboardPage } from '@/pages/archive/ArchiveDashboardPage';
import { ArchiveFilesPage } from '@/pages/archive/ArchiveFilesPage';
import { ArchiveStarredPage } from '@/pages/archive/ArchiveStarredPage';
import { ArchiveTrashPage } from '@/pages/archive/ArchiveTrashPage';
import { ArchivePluginsPage } from '@/pages/archive/ArchivePluginsPage';
import { ArchiveTodoPage } from '@/pages/archive/ArchiveTodoPage';
import { ArchiveJobTrackerPage } from '@/pages/archive/ArchiveJobTrackerPage';
import { ArchiveJobApplicationsPage } from '@/pages/archive/ArchiveJobApplicationsPage';
import { ArchiveJobApplicationFormPage } from '@/pages/archive/ArchiveJobApplicationFormPage';
import { ArchiveOutreachPage } from '@/pages/archive/ArchiveOutreachPage';
import { ArchiveContactFinderPage } from '@/pages/archive/ArchiveContactFinderPage';
import { ArchiveTelegramPage } from '@/pages/archive/ArchiveTelegramPage';

// Steampunk Theme imports
import { SteamDashboardPage } from '@/pages/steam/SteamDashboardPage';
import { SteamFilesPage } from '@/pages/steam/SteamFilesPage';
import { SteamStarredPage } from '@/pages/steam/SteamStarredPage';
import { SteamTrashPage } from '@/pages/steam/SteamTrashPage';
import { SteamPluginsPage } from '@/pages/steam/SteamPluginsPage';
import { SteamTodoPage } from '@/pages/steam/SteamTodoPage';
import { SteamJobTrackerPage } from '@/pages/steam/SteamJobTrackerPage';
import { SteamJobApplicationsPage } from '@/pages/steam/SteamJobApplicationsPage';
import { SteamJobApplicationFormPage } from '@/pages/steam/SteamJobApplicationFormPage';
import { SteamOutreachPage } from '@/pages/steam/SteamOutreachPage';
import { SteamContactFinderPage } from '@/pages/steam/SteamContactFinderPage';
import { SteamTelegramPage } from '@/pages/steam/SteamTelegramPage';

// Aurora Theme imports
import { AuroraDashboardPage } from '@/pages/aurora/AuroraDashboardPage';
import { AuroraFilesPage } from '@/pages/aurora/AuroraFilesPage';
import { AuroraStarredPage } from '@/pages/aurora/AuroraStarredPage';
import { AuroraTrashPage } from '@/pages/aurora/AuroraTrashPage';
import { AuroraPluginsPage } from '@/pages/aurora/AuroraPluginsPage';
import { AuroraTodoPage } from '@/pages/aurora/AuroraTodoPage';
import { AuroraJobTrackerPage } from '@/pages/aurora/AuroraJobTrackerPage';
import { AuroraJobApplicationsPage } from '@/pages/aurora/AuroraJobApplicationsPage';
import { AuroraJobApplicationFormPage } from '@/pages/aurora/AuroraJobApplicationFormPage';
import { AuroraOutreachPage } from '@/pages/aurora/AuroraOutreachPage';
import { AuroraContactFinderPage } from '@/pages/aurora/AuroraContactFinderPage';
import { AuroraTelegramPage } from '@/pages/aurora/AuroraTelegramPage';

// Minimalist Zen Theme imports
import { ZenDashboardPage } from '@/pages/zen/ZenDashboardPage';
import { ZenFilesPage } from '@/pages/zen/ZenFilesPage';
import { ZenStarredPage } from '@/pages/zen/ZenStarredPage';
import { ZenTrashPage } from '@/pages/zen/ZenTrashPage';
import { ZenPluginsPage } from '@/pages/zen/ZenPluginsPage';
import { ZenTodoPage } from '@/pages/zen/ZenTodoPage';
import { ZenJobTrackerPage } from '@/pages/zen/ZenJobTrackerPage';
import { ZenJobApplicationsPage } from '@/pages/zen/ZenJobApplicationsPage';
import { ZenJobApplicationFormPage } from '@/pages/zen/ZenJobApplicationFormPage';
import { ZenOutreachPage } from '@/pages/zen/ZenOutreachPage';
import { ZenContactFinderPage } from '@/pages/zen/ZenContactFinderPage';
import { ZenTelegramPage } from '@/pages/zen/ZenTelegramPage';

// Skeuomorphism 2.0 (Tactile Tech) Theme imports
import { SkeuDashboardPage } from '@/pages/skeu/SkeuDashboardPage';
import { SkeuFilesPage } from '@/pages/skeu/SkeuFilesPage';
import { SkeuStarredPage } from '@/pages/skeu/SkeuStarredPage';
import { SkeuTrashPage } from '@/pages/skeu/SkeuTrashPage';
import { SkeuPluginsPage } from '@/pages/skeu/SkeuPluginsPage';
import { SkeuTodoPage } from '@/pages/skeu/SkeuTodoPage';
import { SkeuJobTrackerPage } from '@/pages/skeu/SkeuJobTrackerPage';
import { SkeuJobApplicationsPage } from '@/pages/skeu/SkeuJobApplicationsPage';
import { SkeuJobApplicationFormPage } from '@/pages/skeu/SkeuJobApplicationFormPage';
import { SkeuOutreachPage } from '@/pages/skeu/SkeuOutreachPage';
import { SkeuContactFinderPage } from '@/pages/skeu/SkeuContactFinderPage';
import { SkeuTelegramPage } from '@/pages/skeu/SkeuTelegramPage';

// Paper/Stationery Theme imports
import { PaperDashboardPage } from '@/pages/paper/PaperDashboardPage';
import { PaperFilesPage } from '@/pages/paper/PaperFilesPage';
import { PaperStarredPage } from '@/pages/paper/PaperStarredPage';
import { PaperTrashPage } from '@/pages/paper/PaperTrashPage';
import { PaperPluginsPage } from '@/pages/paper/PaperPluginsPage';
import { PaperTodoPage } from '@/pages/paper/PaperTodoPage';
import { PaperJobTrackerPage } from '@/pages/paper/PaperJobTrackerPage';
import { PaperJobApplicationsPage } from '@/pages/paper/PaperJobApplicationsPage';
import { PaperJobApplicationFormPage } from '@/pages/paper/PaperJobApplicationFormPage';
import { PaperOutreachPage } from '@/pages/paper/PaperOutreachPage';
import { PaperContactFinderPage } from '@/pages/paper/PaperContactFinderPage';
import { PaperTelegramPage } from '@/pages/paper/PaperTelegramPage';

// Corporate Executive Theme imports
import { ExecDashboardPage } from '@/pages/exec/ExecDashboardPage';
import { ExecFilesPage } from '@/pages/exec/ExecFilesPage';
import { ExecStarredPage } from '@/pages/exec/ExecStarredPage';
import { ExecTrashPage } from '@/pages/exec/ExecTrashPage';
import { ExecPluginsPage } from '@/pages/exec/ExecPluginsPage';
import { ExecTodoPage } from '@/pages/exec/ExecTodoPage';
import { ExecJobTrackerPage } from '@/pages/exec/ExecJobTrackerPage';
import { ExecJobApplicationsPage } from '@/pages/exec/ExecJobApplicationsPage';
import { ExecJobApplicationFormPage } from '@/pages/exec/ExecJobApplicationFormPage';
import { ExecOutreachPage } from '@/pages/exec/ExecOutreachPage';
import { ExecContactFinderPage } from '@/pages/exec/ExecContactFinderPage';
import { ExecTelegramPage } from '@/pages/exec/ExecTelegramPage';

// Pixel Art Theme imports
import { PixelDashboardPage } from '@/pages/pixel/PixelDashboardPage';
import { PixelFilesPage } from '@/pages/pixel/PixelFilesPage';
import { PixelStarredPage } from '@/pages/pixel/PixelStarredPage';
import { PixelTrashPage } from '@/pages/pixel/PixelTrashPage';
import { PixelPluginsPage } from '@/pages/pixel/PixelPluginsPage';
import { PixelTodoPage } from '@/pages/pixel/PixelTodoPage';
import { PixelJobTrackerPage } from '@/pages/pixel/PixelJobTrackerPage';
import { PixelJobApplicationsPage } from '@/pages/pixel/PixelJobApplicationsPage';
import { PixelJobApplicationFormPage } from '@/pages/pixel/PixelJobApplicationFormPage';
import { PixelOutreachPage } from '@/pages/pixel/PixelOutreachPage';
import { PixelContactFinderPage } from '@/pages/pixel/PixelContactFinderPage';
import { PixelTelegramPage } from '@/pages/pixel/PixelTelegramPage';

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

  // Comic Book Theme
  if (version === 'comic') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><ComicDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><ComicFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><ComicTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><ComicStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><ComicTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><ComicPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><ComicTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><ComicJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><ComicJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><ComicJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><ComicOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><ComicContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Archival Index Theme
  if (version === 'archive') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><ArchiveDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><ArchiveFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><ArchiveTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><ArchiveStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><ArchiveTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><ArchivePluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><ArchiveTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><ArchiveJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><ArchiveJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><ArchiveJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><ArchiveOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><ArchiveContactFinderPage /></ProtectedRoute>} />
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

  // Steampunk Theme
  if (version === 'steam') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><SteamDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><SteamFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><SteamTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><SteamStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><SteamTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><SteamPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><SteamTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><SteamJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><SteamJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><SteamJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><SteamOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><SteamContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Aurora Theme
  if (version === 'aurora') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><AuroraDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><AuroraFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><AuroraTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><AuroraStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><AuroraTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><AuroraPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><AuroraTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><AuroraJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><AuroraJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><AuroraJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><AuroraOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><AuroraContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Minimalist Zen Theme
  if (version === 'zen') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><ZenDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><ZenFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><ZenTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><ZenStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><ZenTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><ZenPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><ZenTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><ZenJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><ZenJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><ZenJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><ZenOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><ZenContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Skeuomorphism 2.0 (Tactile Tech) Theme
  if (version === 'skeu') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><SkeuDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><SkeuFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><SkeuTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><SkeuStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><SkeuTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><SkeuPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><SkeuTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><SkeuJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><SkeuJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><SkeuJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><SkeuOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><SkeuContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Paper/Stationery Theme
  if (version === 'paper') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><PaperDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><PaperFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><PaperTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><PaperStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><PaperTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><PaperPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><PaperTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><PaperJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><PaperJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><PaperJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><PaperOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><PaperContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Corporate Executive Theme
  if (version === 'exec') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><ExecDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><ExecFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><ExecTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><ExecStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><ExecTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><ExecPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><ExecTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><ExecJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><ExecJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><ExecJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><ExecOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><ExecContactFinderPage /></ProtectedRoute>} />
            <Route path="/plugins/:pluginId" element={<ProtectedRoute><PluginComingSoonPage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharePage />} />
            <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DirectUploadProvider>
      </AuthCheck>
    );
  }

  // Pixel Art Theme
  if (version === 'pixel') {
    return (
      <AuthCheck>
        <DirectUploadProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><PixelDashboardPage /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><PixelFilesPage /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><PixelTelegramPage /></ProtectedRoute>} />
            <Route path="/starred" element={<ProtectedRoute><PixelStarredPage /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><PixelTrashPage /></ProtectedRoute>} />
            <Route path="/plugins" element={<ProtectedRoute><PixelPluginsPage /></ProtectedRoute>} />
            <Route path="/plugins/todo-lists" element={<ProtectedRoute><PixelTodoPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker" element={<ProtectedRoute><PixelJobTrackerPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications" element={<ProtectedRoute><PixelJobApplicationsPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/applications/:id" element={<ProtectedRoute><PixelJobApplicationFormPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/outreach" element={<ProtectedRoute><PixelOutreachPage /></ProtectedRoute>} />
            <Route path="/plugins/job-tracker/contacts" element={<ProtectedRoute><PixelContactFinderPage /></ProtectedRoute>} />
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
