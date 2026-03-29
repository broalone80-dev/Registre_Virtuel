import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { HiOutlineDesktopComputer, HiOutlineClipboardList } from 'react-icons/hi'
import { HiOutlineChartBarSquare, HiOutlineBuildingOffice2, HiOutlineArchiveBox, HiOutlineMagnifyingGlass, HiOutlineWrenchScrewdriver, HiOutlineComputerDesktop, HiOutlineUserGroup, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2'

export default function Navbar() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const isAdmin = useAuthStore((s) => s.isAdmin)
    const isTechnician = useAuthStore((s) => s.isTechnician)
    const isAgent = useAuthStore((s) => s.isAgent)
    const getUserName = useAuthStore((s) => s.getUserName)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const getRoleBadge = () => {
        const role = user?.role
        const badges = {
            super_admin: { label: 'Super Admin', cls: 'role-admin' },
            admin: { label: 'Admin', cls: 'role-admin' },
            manager: { label: 'Manager', cls: 'role-manager' },
            technician: { label: 'Maintenancier', cls: 'role-tech' },
            receptionist: { label: 'Agent', cls: 'role-agent' }
        }
        return badges[role] || { label: role, cls: '' }
    }

    const badge = getRoleBadge()

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <NavLink to="/" className="brand-link">
                    <div className="brand-icon">
                        <img src="/src/assets/logo.png" alt="Logo" className="nav-logo-img" />
                    </div>
                    <div className="brand-text">
                        <span className="brand-title">Registre Virtuel</span>
                        <span className="brand-subtitle">Express Union</span>
                    </div>
                </NavLink>
            </div>

            <ul className="navbar-nav">
                {/* Dashboard — tout le monde */}
                <li className="nav-item">
                    <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon"><HiOutlineChartBarSquare size={18} /></span>
                        <span className="nav-text">Dashboard</span>
                    </NavLink>
                </li>

                {/* Parc — tout le monde */}
                <li className="nav-item">
                    <NavLink to="/parc" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon"><HiOutlineBuildingOffice2 size={18} /></span>
                        <span className="nav-text">Parc</span>
                    </NavLink>
                </li>

                {/* Agent: Dépôt + Suivi */}
                {isAgent() && (
                    <>
                        <li className="nav-item">
                            <NavLink to="/depot" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon"><HiOutlineArchiveBox size={18} /></span>
                                <span className="nav-text">Déposer</span>
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/suivi" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon"><HiOutlineClipboardList size={18} /></span>
                                <span className="nav-text">Suivi</span>
                            </NavLink>
                        </li>
                    </>
                )}

                {/* Admin + Technicien: Équipements */}
                {(isAdmin() || isTechnician()) && (
                    <li className="nav-item">
                        <NavLink to="/equipments" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon"><HiOutlineComputerDesktop size={18} /></span>
                            <span className="nav-text">Équipements</span>
                        </NavLink>
                    </li>
                )}

                {/* Diagnostics — tout le monde */}
                <li className="nav-item">
                    <NavLink to="/diagnostics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon"><HiOutlineMagnifyingGlass size={18} /></span>
                        <span className="nav-text">Diagnostics</span>
                    </NavLink>
                </li>

                {/* Interventions — tout le monde */}
                <li className="nav-item">
                    <NavLink to="/interventions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon"><HiOutlineWrenchScrewdriver size={18} /></span>
                        <span className="nav-text">Interventions</span>
                    </NavLink>
                </li>

                {/* Admin only: Utilisateurs + Agences */}
                {isAdmin() && (
                    <>
                        <li className="nav-separator"></li>
                        <li className="nav-item">
                            <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon"><HiOutlineUserGroup size={18} /></span>
                                <span className="nav-text">Utilisateurs</span>
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/agencies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon"><HiOutlineBuildingOffice2 size={18} /></span>
                                <span className="nav-text">Agences</span>
                            </NavLink>
                        </li>
                    </>
                )}
            </ul>

            <div className="navbar-user">
                <div className="user-info">
                    <span className="user-name">{getUserName()}</span>
                    <span className={`role-badge ${badge.cls}`}>{badge.label}</span>
                </div>
                <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
                    <HiOutlineArrowRightOnRectangle size={20} />
                </button>
            </div>
        </nav>
    )
}
