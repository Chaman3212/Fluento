import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './routes/guards.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages.jsx';
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const StudioPage = lazy(() => import('./pages/StudioPage.jsx'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage.jsx'));
const HistoryPage = lazy(() => import('./pages/HistoryPage.jsx'));
const ReportPage = lazy(() => import('./pages/ReportPage.jsx'));
const ImprovementCenterPage = lazy(() => import('./pages/ImprovementCenterPage.jsx'));
const ProfilePage = lazy(() => import('./pages/AccountPages.jsx').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/AccountPages.jsx').then((m) => ({ default: m.SettingsPage })));
import NotFoundPage from './pages/NotFoundPage.jsx';
import { Skeleton } from './components/ui.jsx';

export default function App() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-40" /></div>}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/feedback/:id" element={<FeedbackPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/improve" element={<ImprovementCenterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}
