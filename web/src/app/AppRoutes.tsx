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
  ActivitiesPage as DirectionActivitiesPage,
  AnnouncementsPage as DirectionAnnouncementsPage,
  DashboardPage as DirectionDashboardPage,
  FilieresSectionsPage,
  ReportsPage as DirectionReportsPage,
  RequestDetailPage as DirectionRequestDetailPage,
  RequestsPage as DirectionRequestsPage,
  SchedulePage as DirectionSchedulePage,
  UsersPage as DirectionUsersPage,
} from './direction/DirectionPages'
import {
  AnnouncementsPage as FormateurAnnouncementsPage,
  CoursesPage,
  DashboardPage as FormateurDashboardPage,
  ProfilePage as FormateurProfilePage,
  UploadPage,
} from './formateur/FormateurPages'
import {
  DashboardPage as ClubDashboardPage,
  EventsPage,
  MembersPage,
  ParticipantsPage,
} from './club/ClubPages'

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
        <Route path="utilisateurs" element={<DirectionUsersPage />} />
        <Route path="filieres" element={<FilieresSectionsPage />} />
        <Route path="activites" element={<DirectionActivitiesPage />} />
        <Route path="emploi-du-temps" element={<DirectionSchedulePage />} />
        <Route path="rapports" element={<DirectionReportsPage />} />
        <Route path="*" element={<WorkspacePlaceholder />} />
      </Route>
      <Route
        path="/app/formateur"
        element={
          <ProtectedRoute role="formateur">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FormateurDashboardPage />} />
        <Route path="cours" element={<CoursesPage />} />
        <Route path="deposer-un-cours" element={<UploadPage />} />
        <Route path="annonces" element={<FormateurAnnouncementsPage />} />
        <Route path="profil" element={<FormateurProfilePage />} />
        <Route path="*" element={<Navigate to="/app/formateur" replace />} />
      </Route>
      <Route
        path="/app/club"
        element={
          <ProtectedRoute role="club">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClubDashboardPage />} />
        <Route path="evenements" element={<EventsPage />} />
        <Route path="participants" element={<ParticipantsPage />} />
        <Route path="membres" element={<MembersPage />} />
        <Route path="*" element={<Navigate to="/app/club" replace />} />
      </Route>
      {USER_ROLES.filter(
        (role) =>
          role !== 'stagiaire' &&
          role !== 'direction' &&
          role !== 'formateur' &&
          role !== 'club',
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
