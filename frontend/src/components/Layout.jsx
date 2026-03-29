import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import NotificationPanel from './NotificationPanel'

export default function Layout() {
    const [showNotifs, setShowNotifs] = useState(false)

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="app-container">
                <Topbar onOpenNotifs={() => setShowNotifs(true)} />
                <main className="app-main">
                    <Outlet />
                </main>
            </div>
            {showNotifs && <NotificationPanel onClose={() => setShowNotifs(false)} />}
        </div>
    )
}
