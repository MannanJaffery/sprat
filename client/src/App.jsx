import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import ProjectOverviewPage from './pages/projects/ProjectOverviewPage';
import DomainsPage from './pages/projects/DomainsPage';
import DocumentsPage from './pages/projects/DocumentsPage';
import DocumentDetailPage from './pages/projects/DocumentDetailPage';
import GoalsListPage from './pages/projects/GoalsListPage';
import GoalDetailPage from './pages/projects/GoalDetailPage';
import ScenariosListPage from './pages/projects/ScenariosListPage';
import ScenarioDetailPage from './pages/projects/ScenarioDetailPage';
import SearchPage from './pages/projects/SearchPage';
import ClassificationTypesPage from './pages/projects/ClassificationTypesPage';
import KeywordDefinitionsPage from './pages/projects/KeywordDefinitionsPage';

import UsersPage from './pages/admin/UsersPage';
import UserGroupsPage from './pages/admin/UserGroupsPage';
import AuditLogPage from './pages/admin/AuditLogPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/:projectId/overview" element={<ProjectOverviewPage />} />
        <Route path="projects/:projectId/domains" element={<DomainsPage />} />
        <Route path="projects/:projectId/documents" element={<DocumentsPage />} />
        <Route path="projects/:projectId/documents/:documentId" element={<DocumentDetailPage />} />
        <Route path="projects/:projectId/goals" element={<GoalsListPage />} />
        <Route path="projects/:projectId/goals/:goalId" element={<GoalDetailPage />} />
        <Route path="projects/:projectId/scenarios" element={<ScenariosListPage />} />
        <Route path="projects/:projectId/scenarios/:scenarioId" element={<ScenarioDetailPage />} />
        <Route path="projects/:projectId/search" element={<SearchPage />} />
        <Route path="projects/:projectId/classifications" element={<ClassificationTypesPage />} />
        <Route path="projects/:projectId/keywords" element={<KeywordDefinitionsPage />} />

        <Route
          path="admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/user-groups"
          element={
            <ProtectedRoute roles={['admin']}>
              <UserGroupsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit-log"
          element={
            <ProtectedRoute roles={['admin', 'project_manager']}>
              <AuditLogPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
