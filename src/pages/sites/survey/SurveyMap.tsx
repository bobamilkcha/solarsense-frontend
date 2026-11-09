import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { scoreColor, type ScoredSpot } from '../../../lib/survey'

type Props = { spots: ScoredSpot[]; site: { lat: number; lng: number } }

function pinIcon(spot: ScoredSpot): L.DivIcon {
  const color = scoreColor(spot.score)
  const text = spot.score === null ? '…' : String(spot.score)
  const ring = spot.rank === 1 ? 'box-shadow:0 0 0 4px rgba(5,150,105,.35);' : ''
  return L.divIcon({
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    html: `<div style="${ring}width:44px;height:44px;border-radius:9999px;background:${color};color:#fff;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font:600 14px system-ui;box-shadow:0 1px 4px rgba(0,0,0,.4)">${text}</div>`,
  })
}

function popupContent(spot: ScoredSpot): HTMLElement {
  const el = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = spot.spot.label
  const detail = document.createElement('div')
  detail.textContent =
    spot.score === null ? 'Not scored yet' : `Score ${spot.score}${spot.rank ? ` · rank ${spot.rank}` : ''}`
  el.append(title, detail)
  return el
}

/** Coloured pins for each surveyed spot over OpenStreetMap. Tap a pin for its score. */
export function SurveyMap({ spots, site }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = L.map(container, { scrollWheelZoom: false }).setView([site.lat, site.lng], 17)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
    // The map is created once; site position changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const bounds = L.latLngBounds([[site.lat, site.lng]])
    L.circleMarker([site.lat, site.lng], { radius: 6, color: '#334155', fillColor: '#fff', fillOpacity: 1, weight: 2 })
      .bindTooltip('Site location')
      .addTo(layer)
    for (const s of spots) {
      const at: L.LatLngTuple = [s.spot.lat, s.spot.lng]
      bounds.extend(at)
      if (s.spot.accuracy_m) {
        L.circle(at, { radius: s.spot.accuracy_m, color: scoreColor(s.score), weight: 1, fillOpacity: 0.08 }).addTo(layer)
      }
      L.marker(at, { icon: pinIcon(s), title: s.spot.label }).bindPopup(popupContent(s)).addTo(layer)
    }
    map.invalidateSize()
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 })
  }, [spots, site.lat, site.lng])

  return (
    <div
      ref={containerRef}
      className="z-0 h-72 w-full overflow-hidden rounded-xl ring-1 ring-slate-200 sm:h-96"
      role="application"
      aria-label="Map of surveyed spots"
    />
  )
}
