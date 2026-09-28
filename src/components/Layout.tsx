import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Compass, MapPinned, Newspaper, Route, User } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useSocial } from '../store/SocialStore'

const TABS = [
  { to: '/akis', label: 'Akış', Icon: Newspaper, end: false },
  { to: '/', label: 'Keşfet', Icon: Compass, end: true },
  { to: '/harita', label: 'Harita', Icon: MapPinned, end: false },
  { to: '/geziler', label: 'Gezilerim', Icon: Route, end: false },
  { to: '/profil', label: 'Profil', Icon: User, end: false },
]

export default function Layout() {
  const { trips } = useApp()
  const { unreadCount } = useSocial()
  const { pathname } = useLocation()

  const badgeFor = (to: string) => {
    if (to === '/akis' && unreadCount > 0) return unreadCount
    if (to === '/geziler' && trips.length > 0) return trips.length
    return null
  }

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
              <span className="tabbar__indicator" aria-hidden />
              <span className="tabbar__icon">
                <tab.Icon size={21} aria-hidden />
                {badge !== null && <i className="tabbar__badge anim-pop">{badge > 99 ? '99+' : badge}</i>}
              </span>
              <span className="tabbar__label">{tab.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
