// src/App.tsx — layout racine, aucune logique métier
import { MapView } from './components/MapView'
import { SidePanel } from './components/SidePanel'

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* Map — position absolute, plein écran, z-index 0 implicite */}
      <MapView />
      {/* Panneau — position fixed, z-index 10, 320px droite */}
      <SidePanel />
    </div>
  )
}
