import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

// Extracted page components
import EarlyAccessPage from '../pages/EarlyAccessPage';
import LoginPage from '../pages/LoginPage';
import PasswordResetPage from '../pages/PasswordResetPage';
import ClientPortalLayout from '../pages/client/ClientPortalLayout';
import AdminPortalLayout from '../pages/admin/AdminPortalLayout';

export const AppRoutes = ({
  LandingPage,
  handleAuthSubmit,
  handleClientUpdate,
  handleClientDelete,
  adminSettings,
  // Client view components
  ClientDashboardView,
  ClientProjectsView,
  ClientDocumentsView,
  ClientMessagesView,
  ClientInvoicesView,
  ClientKnowledgeBaseView,
  SettingsView,
  // Admin view components
  AdminDashboardView,
  AdminPipelineView,
  AdminTasksView,
  AdminClientsManager,
  AdminFinancialsView,
  AdminAnalyticsView,
  AdminDataAIView,
  AdminReportsView,
  AdminActivityLogsView,
  AdminUsersManager,
  AdminGlobalSettingsView
}) => {
  // Check if we're before the launch date (January 2, 2026)
  const LAUNCH_DATE = new Date('2026-01-02T00:00:00');
  const isBeforeLaunch = new Date() < LAUNCH_DATE;

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={isBeforeLaunch ? <EarlyAccessPage /> : <LandingPage onLogin={() => window.location.href = '/login'} />}
      />
      <Route
        path="/home"
        element={<LandingPage onLogin={() => window.location.href = '/login'} />}
      />
      <Route
        path="/login"
        element={
          <LoginPage
            onAuthSubmit={handleAuthSubmit}
            onBack={() => window.location.href = '/'}
            maintenanceMode={adminSettings.maintenanceMode}
          />
        }
      />

      {/* Password Reset (requires auth state from login) */}
      <Route
        path="/reset-password"
        element={<PasswordResetPage />}
      />

      {/* Client Portal - Protected */}
      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route element={<ClientPortalLayout onUpdateClient={handleClientUpdate} />}>
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={<ClientDashboardView />} />
          <Route path="projects" element={<ClientProjectsView />} />
          <Route path="documents" element={<ClientDocumentsView />} />
          <Route path="messages" element={<ClientMessagesView />} />
          <Route path="invoices" element={<ClientInvoicesView />} />
          <Route path="knowledge" element={<ClientKnowledgeBaseView />} />
          <Route path="settings" element={<SettingsView onDeleteAccount={handleClientDelete} />} />
        </Route>
      </Route>

      {/* Admin Portal - Protected + Admin Only */}
      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<AdminPortalLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardView />} />
          <Route path="projects" element={<AdminPipelineView />} />
          <Route path="tasks" element={<AdminTasksView />} />
          <Route path="clients" element={<AdminClientsManager />} />
          <Route path="financials" element={<AdminFinancialsView />} />
          <Route path="analytics" element={<AdminAnalyticsView />} />
          <Route path="data" element={<AdminDataAIView />} />
          <Route path="reports" element={<AdminReportsView />} />
          <Route path="logs" element={<AdminActivityLogsView />} />
          <Route path="users" element={<AdminUsersManager />} />
          <Route path="settings" element={<AdminGlobalSettingsView />} />
        </Route>
      </Route>

      {/* 404 - Redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
