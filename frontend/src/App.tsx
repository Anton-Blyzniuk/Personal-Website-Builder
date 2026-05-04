import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { usersApi } from './api/users';
import { ToastProvider } from './hooks/useToast';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { PWBUnitCreatePage } from './pages/PWBUnitCreatePage';
import { PWBUnitEditPage } from './pages/PWBUnitEditPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { DocsPage } from './pages/DocsPage';
import { PWBUnitImportPage } from './pages/PWBUnitImportPage';
import { CVPage } from './pages/CVPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestRoute() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// Re-key on location so each page re-runs its enter animation
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/cv/:unitName" element={<CVPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/pwbunits/new" element={<PWBUnitCreatePage />} />
        <Route path="/dashboard/pwbunits/import" element={<PWBUnitImportPage />} />
        <Route path="/dashboard/pwbunits/:unit_name/edit" element={<PWBUnitEditPage />} />
        <Route path="/dashboard/api-keys" element={<ApiKeysPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppInit() {
  const { initialize, isAuthenticated, user, setUser } = useAuthStore();
  const { init } = useThemeStore();

  useEffect(() => {
    init();
    initialize();
  }, [init, initialize]);

  // Restore user profile from API after a page refresh (tokens exist but user object is gone)
  useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const profile = await usersApi.getProfile();
      setUser(profile);
      return profile;
    },
    enabled: isAuthenticated && !user,
    staleTime: Infinity,
    retry: false,
  });

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppInit />
          <AnimatedRoutes />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
