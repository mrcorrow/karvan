import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider } from './store/AppStore'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import DiscoverScreen from './screens/DiscoverScreen'
import MapScreen from './screens/MapScreen'
import SearchScreen from './screens/SearchScreen'
import CampDetailScreen from './screens/CampDetailScreen'
import TripsScreen from './screens/TripsScreen'
import TripEditorScreen from './screens/TripEditorScreen'
import TripDetailScreen from './screens/TripDetailScreen'
import ProfileScreen from './screens/ProfileScreen'

const TITLES: { match: (path: string) => boolean; title: string }[] = [
  { match: (path) => path.startsWith('/kamp'), title: 'Kamp detayı' },
  { match: (path) => path === '/harita', title: 'Harita' },
  { match: (path) => path.startsWith('/ara'), title: 'Ara' },
  { match: (path) => path.startsWith('/geziler'), title: 'Gezilerim' },
  { match: (path) => path.startsWith('/profil'), title: 'Profil' },
  { match: () => true, title: 'Keşfet' },
]

/** Sayfa değişince en üste kaydır ve sekme başlığını güncelle. */
function RouteEffects() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    const entry = TITLES.find((item) => item.match(pathname))
    document.title = entry ? `${entry.title} · Karvan` : 'Karvan'
  }, [pathname])
  return null
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <RouteEffects />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DiscoverScreen />} />
            <Route path="/harita" element={<MapScreen />} />
            <Route path="/ara" element={<SearchScreen />} />
            <Route path="/geziler" element={<TripsScreen />} />
            <Route path="/geziler/yeni" element={<TripEditorScreen />} />
            <Route path="/geziler/:tripId" element={<TripDetailScreen />} />
            <Route path="/geziler/:tripId/duzenle" element={<TripEditorScreen />} />
            <Route path="/profil" element={<ProfileScreen />} />
          </Route>
          <Route path="/kamp/:campId" element={<CampDetailScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AppProvider>
  )
}
