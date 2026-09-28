import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Compass, MapPinned, Route, Search, User } from 'lucide-react'
import { useApp } from '../store/AppStore'

const TABS = [
  { to: '/', label: 'Keşfet', Icon: Compass, end: true },
  { to: '/harita', label: 'Harita', Icon: MapPinned, end: false },
  { to: '/ara', label: 'Ara', Icon: Search, end: false },
  { to: '/geziler', label: 'Gezilerim', Icon: Route, end: false },
  { to: '/profil', label: 'Profil', Icon: User, end: false },
]

export default function Layout() {
  const { trips } = useApp()
  const { pathname } = useLocation()

  const badgeFor = (to: string) => (to === '/geziler' && trips.length > 0 ? trips.length : null)

  return (
    <div className={`app-shell${pathname === '/harita' ? ' app-shell--flush' : ''}`}>
      <main className="app-main">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Ana gezinme">
        {TABS.map((tab) => {
          const badge = badgeFor(tab.to)
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `tabbar__item${isActive ? ' is-active' : ''}`}
            >
              <span className="tabbar__icon">
                <tab.Icon size={21} aria-hidden />
                {badge !== null && <i className="tabbar__badge">{badge}</i>}
              </span>
              <span className="tabbar__label">{tab.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
