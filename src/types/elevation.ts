// src/types/elevation.ts
// Types du profil altimétrique — Phase 2
// null d'élévation API normalisé à 0 lors du fetch (hors-couverture DEM = mer ou zone isolée)

export interface ElevationPoint {
  distance: number  // km depuis le début du tracé
  altitude: number  // mètres Copernicus GLO-30 (null normalisé à 0 lors du fetch)
}

export interface UphillSegment {
  distanceStart: number  // km — début du segment montant
  distanceEnd:   number  // km — fin du segment montant
  altitudeGain:  number  // m — dénivelé positif du segment (toujours > 0)
}

export interface ElevationProfile {
  points:          ElevationPoint[]  // 100 points ordonnés par distance croissante
  uphillSegments:  UphillSegment[]   // segments où l'altitude monte (eau ne peut pas couler)
  totalUphillGain: number            // m — somme de tous les altitudeGain
  isFullyGravity:  boolean           // true si uphillSegments.length === 0
  fetchedAt:       number            // Date.now() — cache mémoire Zustand, re-fetch si reload
}
