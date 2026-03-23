import { useState } from 'react'

/**
 * Hook to handle browser geolocation capture
 */
export function useGeolocation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [coords, setCoords] = useState(null)

  const captureLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported by your browser.'
        setError(err)
        return reject(err)
      }

      setLoading(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setCoords(newCoords)
          setLoading(false)
          resolve(newCoords)
        },
        (error) => {
          let msg = 'Could not capture location.'
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission denied. Checked in without GPS.'
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out. Checked in without GPS.'
          }
          setError(msg)
          setLoading(false)
          // Resolve with null instead of rejecting, to unblock the employee flow.
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  return { captureLocation, loading, error, coords }
}
