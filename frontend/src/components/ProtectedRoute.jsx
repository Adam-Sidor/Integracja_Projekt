import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Chroni trasę — niezalogowany użytkownik zostaje przekierowany na /auth.
 * Po zalogowaniu powróci pod oryginalny adres dzięki state.from.
 */
export default function ProtectedRoute({ children }) {
  const { session } = useAuth()
  const location    = useLocation()

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}
