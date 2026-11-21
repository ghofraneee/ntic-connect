import { Navigate, Route, Routes } from 'react-router-dom'
import App from '../App'
import LoginPage from './login/LoginPage'
import ProtectedRoute from '../auth/ProtectedRoute'
import { USER_ROLES } from '../auth/roles'
import AppLayout from './layout/AppLayout'
import { WorkspacePlaceholder } from './RoutePlaceholders'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {USER_ROLES.map((role) => (
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
