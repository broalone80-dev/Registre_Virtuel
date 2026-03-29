import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { HiOutlineChartBar, HiOutlineDesktopComputer, HiOutlineClipboardList, HiOutlineSearch, HiOutlineCog, HiOutlineLogout, HiOutlineUserGroup, HiOutlineOfficeBuilding, HiOutlineMenu, HiOutlineX } from 'react-icons/hi'
import { HiOutlineWrenchScrewdriver, HiOutlineCpuChip, HiOutlineArchiveBox, HiOutlineClipboardDocumentCheck } from 'react-icons/hi2'

export default function Sidebar() {
    const navigate = useNavigate()
    const location = useLocation()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const isAdmin = useAuthStore((s) => s.isAdmin)
    const isTechnician = useAuthStore((s) => s.isTechnician)
    const isAgent = useAuthStore((s) => s.isAgent)
    const getUserName = useAuthStore((s) => s.getUserName)

    const [mobileOpen, setMobileOpen] = useState(false)

    // Close sidebar on navigation (mobile)
    useEffect(() => {
        setMobileOpen(false)
    }, [location.pathname])

    // Close sidebar on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setMobileOpen(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getRoleBadge = () => {
        const role = user?.role
        const badges = {
            super_admin: { label: 'SUPER ADMIN', cls: 'role-admin' },
            admin: { label: 'ADMIN', cls: 'role-admin' },
            manager: { label: 'MANAGER', cls: 'role-manager' },
            technician: { label: 'MAINTENANCIER', cls: 'role-tech' },
            receptionist: { label: 'AGENT', cls: 'role-agent' }
        }
        return badges[role] || { label: role, cls: '' }
    }

    const badge = getRoleBadge()
    const initials = user ? `${(user.first_name || 'A')[0]}${(user.last_name || 'P')[0]}`.toUpperCase() : 'AP'

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className={`sidebar-hamburger ${mobileOpen ? 'open' : ''}`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Overlay for mobile */}
            {mobileOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
            )}

            <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
                {/* Brand */}
                <div className="sidebar-brand">
                    <NavLink to="/" className="sidebar-brand-link">
                        <div className="sidebar-logo">
                            <span className="sidebar-logo-icon"><HiOutlineClipboardList size={28} /></span>
                        </div>
                        <div className="sidebar-brand-text">
                            <span className="sidebar-brand-title">REGISTRE VIRTUEL</span>
                            <span className="sidebar-brand-sub">EXPRESS UNION</span>
                        </div>
                    </NavLink>
                </div>

                {/* Main Navigation */}
                <nav className="sidebar-nav">
                    <ul className="sidebar-nav-list">
                        <li>
                            <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                <span className="sidebar-link-icon"><HiOutlineChartBar size={20} /></span>
                                <span className="sidebar-link-text">Tableau de bord</span>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/parc" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                <span className="sidebar-link-icon"><HiOutlineDesktopComputer size={20} /></span>
                                <span className="sidebar-link-text">Parc</span>
                            </NavLink>
                        </li>

                        {/* Admin + Technicien: Équipements & Interventions */}
                        {(isAdmin() || isTechnician()) && (
                            <>
                                <li>
                                    <NavLink to="/equipments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                        <span className="sidebar-link-icon"><HiOutlineCpuChip size={20} /></span>
                                        <span className="sidebar-link-text">Gestion Équipements</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/diagnostics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                        <span className="sidebar-link-icon"><HiOutlineSearch size={20} /></span>
                                        <span className="sidebar-link-text">Diagnostics</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/interventions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                        <span className="sidebar-link-icon"><HiOutlineWrenchScrewdriver size={20} /></span>
                                        <span className="sidebar-link-text">Interventions</span>
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {/* Agent: Dépôt + Suivi */}
                        {isAgent() && (
                            <>
                                <li>
                                    <NavLink to="/depot" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                        <span className="sidebar-link-icon"><HiOutlineArchiveBox size={20} /></span>
                                        <span className="sidebar-link-text">Déposer</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/suivi" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                        <span className="sidebar-link-icon"><HiOutlineClipboardDocumentCheck size={20} /></span>
                                        <span className="sidebar-link-text">Suivi</span>
                                    </NavLink>
                                </li>
                            </>
                        )}
                    </ul>



                    {/* Admin-only section */}
                    {isAdmin() && (
                        <div className="sidebar-section">
                            <ul className="sidebar-nav-list">
                                <li>
                                    <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                        <span className="sidebar-link-icon"><HiOutlineUserGroup size={20} /></span>
                                        <span className="sidebar-link-text">Utilisateurs</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/agencies" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                                        <span className="sidebar-link-icon"><HiOutlineOfficeBuilding size={20} /></span>
                                        <span className="sidebar-link-text">Agences</span>
                                    </NavLink>
                                </li>
                            </ul>
                        </div>
                    )}
                </nav>

                {/* User section at bottom */}
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{getUserName()}</span>
                        <span className={`sidebar-role-badge ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <button className="sidebar-logout" onClick={handleLogout} title="Déconnexion">
                        <HiOutlineLogout size={20} />
                    </button>
                </div>
            </aside>
        </>
    )
}
