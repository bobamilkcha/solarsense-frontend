export type Position = { lat: number; lng: number; accuracyM: number | null }

/** One high-accuracy GPS fix from the browser, with an error message a user can act on. */
export function getPosition(timeoutMs = 20_000): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) {
      reject(
        new Error(
          'Location needs a secure (https) connection. Open the app through the https link, not the plain http address.',
        ),
      )
      return
    }
    if (!navigator.geolocation) {
      reject(new Error("This browser can't provide a location."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: p.coords.accuracy ?? null }),
      (e) => {
        if (e.code === e.PERMISSION_DENIED) reject(new Error('Location permission was denied. Allow it for this site in your browser settings.'))
        else if (e.code === e.TIMEOUT) reject(new Error('Getting your location took too long. Move to open sky and try again.'))
        else reject(new Error("Couldn't get your location. Check that GPS is on and try again."))
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    )
  })
}
