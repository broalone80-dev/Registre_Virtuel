import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import EquipmentsPage from './pages/EquipmentsPage'
import DiagnosticsPage from './pages/DiagnosticsPage'
import InterventionsPage from './pages/InterventionsPage'
import UsersPage from './pages/UsersPage'
import AgenciesPage from './pages/AgenciesPage'
import DepotPage from './pages/DepotPage'
import SuiviPage from './pages/SuiviPage'
import ParcPage from './pages/ParcPage'
import ScanPage from './pages/ScanPage'

// Route protégée — redirige vers /login si pas authentifié
function ProtectedRoute({ children }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    if (!isAuthenticated) return <Navigate to="/login" replace />
    return children
}

// Route publique — redirige vers / si déjà authentifié
function PublicRoute({ children }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    if (isAuthenticated) return <Navigate to="/" replace />
    return children
}

// Route avec restriction de rôle
function RoleRoute({ children, roles }) {
    const user = useAuthStore((s) => s.user)
    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/" replace />
    }
    return children
}

export default function App() {
    const restoreSession = useAuthStore((s) => s.restoreSession)

    useEffect(() => {
        restoreSession()
    }, [restoreSession])

    return (
        <BrowserRouter>
            <Routes>
                {/* Routes publiques */}
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
                <Route path="/scan/:token" element={<ScanPage />} />

                {/* Routes protégées avec layout */}
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    {/* Dashboard — accessible à tous */}
                    <Route path="/" element={<DashboardPage />} />

                    {/* Équipements — Admin + Technicien */}
                    <Route path="/equipments" element={
                        <RoleRoute roles={['super_admin', 'admin', 'manager', 'technician']}>
                            <EquipmentsPage />
                        </RoleRoute>
                    } />

                    {/* Diagnostics — tous les rôles (lecture seule pour Agent) */}
                    <Route path="/diagnostics" element={<DiagnosticsPage />} />

                    {/* Interventions — tous les rôles (lecture seule pour Agent) */}
                    <Route path="/interventions" element={<InterventionsPage />} />

                    {/* Gestion utilisateurs — Admin uniquement */}
                    <Route path="/users" element={
                        <RoleRoute roles={['super_admin', 'admin']}>
                            <UsersPage />
                        </RoleRoute>
                    } />

                    {/* Gestion agences — Admin uniquement */}
                    <Route path="/agencies" element={
                        <RoleRoute roles={['super_admin', 'admin']}>
                            <AgenciesPage />
                        </RoleRoute>
                    } />

                    {/* Dépôt équipement — Agent uniquement */}
                    <Route path="/depot" element={
                        <RoleRoute roles={['receptionist', 'super_admin', 'admin']}>
                            <DepotPage />
                        </RoleRoute>
                    } />

                    {/* Suivi équipements — Agent uniquement */}
                    <Route path="/suivi" element={
                        <RoleRoute roles={['receptionist', 'super_admin', 'admin']}>
                            <SuiviPage />
                        </RoleRoute>
                    } />

                    {/* Parc Informatique — tous les rôles */}
                    <Route path="/parc" element={<ParcPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
