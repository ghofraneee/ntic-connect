import { Navigate, Route, Routes } from 'react-router-dom'
import App from '../App'
import LoginPage from './login/LoginPage'
import ProtectedRoute from '../auth/ProtectedRoute'
import { USER_ROLES } from '../auth/roles'
import AppLayout from './layout/AppLayout'
import { WorkspacePlaceholder } from './RoutePlaceholders'
import {
  AnnouncementsPage,
  ClubsPage,
  DashboardPage,
  LibraryPage,
  NewRequestPage,
  OpportunitiesPage,
  ProfilePage,
  RequestDetailPage,
  RequestsPage,
  SchedulePage,
} from './stagiaire/StagiairePages'
import {
  AnnouncementsPage as DirectionAnnouncementsPage,
  DashboardPage as DirectionDashboardPage,
  RequestDetailPage as DirectionRequestDetailPage,
  RequestsPage as DirectionRequestsPage,
} from './direction/DirectionPages'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app/stagiaire"
        element={
          <ProtectedRoute role="stagiaire">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="annonces" element={<AnnouncementsPage />} />
        <Route path="bibliotheque" element={<LibraryPage />} />
        <Route path="demandes" element={<RequestsPage />} />
        <Route path="demandes/nouvelle" element={<NewRequestPage />} />
        <Route path="demandes/:requestId" element={<RequestDetailPage />} />
        <Route path="emploi-du-temps" element={<SchedulePage />} />
        <Route path="clubs" element={<ClubsPage />} />
        <Route path="opportunites" element={<OpportunitiesPage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/app/stagiaire" replace />} />
      </Route>
      <Route
        path="/app/direction"
        element={
          <ProtectedRoute role="direction">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DirectionDashboardPage />} />
        <Route path="demandes" element={<DirectionRequestsPage />} />
        <Route path="demandes/:requestId" element={<DirectionRequestDetailPage />} />
        <Route path="annonces" element={<DirectionAnnouncementsPage />} />
        <Route path="*" element={<WorkspacePlaceholder />} />
      </Route>
      {USER_ROLES.filter(
        (role) => role !== 'stagiaire' && role !== 'direction',
      ).map((role) => (
        <Route
          key={role}
          path={`/app/${role}`}
          element={
            <ProtectedRoute role={role}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkspacePlaceholder />} />
          <Route path="*" element={<WorkspacePlaceholder />} />
        </Route>
      ))}
      <Route path="/app/*" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<App />} />
    </Routes>
  )
}
