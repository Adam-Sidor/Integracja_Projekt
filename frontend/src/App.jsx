import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Layout from './layouts/Layout'
import StartPage from './pages/StartPage'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import ProtectedRoute from './components/ProtectedRoute'

/** Przekierowuje zalogowanych z / na /dashboard */
function RootRedirect() {
  const { session } = useAuth()
  return session ? <Navigate to="/dashboard" replace /> : <StartPage />
}

/** Przekierowuje zalogowanych z /auth na /dashboard */
function AuthRedirect() {
  const { session } = useAuth()
  return session ? <Navigate to="/dashboard" replace /> : <AuthPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Strona startowa — bez layoutu z navbarem */}
          <Route path="/" element={<RootRedirect />} />

          {/* Logowanie / rejestracja — bez layoutu */}
          <Route path="/auth" element={<AuthRedirect />} />

          {/* Chronione trasy — z pełnym layoutem */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
