import { useState, useEffect } from 'react'
import { attendanceService } from '../services/attendance'
import { useGeolocation } from '../hooks/useGeolocation'
import { MapPin, LogIn, LogOut, Clock, Loader2 } from 'lucide-react'

export default function AttendancePanel({ user }) {
  const [activeSession, setActiveSession] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { captureLocation, loading: geoLoading, error: geoError } = useGeolocation()

  useEffect(() => {
    fetchStatus()

    // Multiple tab sync
    const handleStorage = () => fetchStatus()
    window.addEventListener('storage', handleStorage)
    window.addEventListener('online', syncOfflineLogs)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('online', syncOfflineLogs)
    }
  }, [user.id])

  async function syncOfflineLogs() {
    const pendingIn = localStorage.getItem('offline_checkin')
    if (pendingIn) {
      const data = JSON.parse(pendingIn)
      await attendanceService.checkIn(data.employee_id, { lat: data.lat, lng: data.lng })
      localStorage.removeItem('offline_checkin')
    }
    const pendingOut = localStorage.getItem('offline_checkout')
    if (pendingOut) {
      const data = JSON.parse(pendingOut)
      await attendanceService.checkOut(data.employee_id, { lat: data.lat, lng: data.lng })
      localStorage.removeItem('offline_checkout')
    }
    fetchStatus()
  }

  async function fetchStatus() {
    try {
      setLoading(true)
      const session = await attendanceService.getActiveSession(user.id)
      setActiveSession(session)
      
      const todayLogs = await attendanceService.getTodayLogs(user.id)
      setLogs(todayLogs)
    } catch (err) {
      console.error('Fetch status error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckIn() {
    try {
      setError(null)
      const coords = await captureLocation()
      await attendanceService.checkIn(user.id, coords)
      localStorage.setItem('sync_signal', Date.now().toString()) // Trigger tab sync
      await fetchStatus()
    } catch (err) {
      setError(err.message || err)
    }
  }

  async function handleCheckOut() {
    try {
      setError(null)
      const coords = await captureLocation()
      await attendanceService.checkOut(user.id, coords)
      localStorage.setItem('sync_signal', Date.now().toString()) // Trigger tab sync
      await fetchStatus()
    } catch (err) {
      setError(err.message || err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="card attendance-card">
      <div className="card-header">
        <h2 className="card-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Attendance
        </h2>
        <span className={`badge ${activeSession ? 'badge-success' : 'badge-error'}`}>
          {activeSession ? 'Working' : 'Checked Out'}
        </span>
      </div>

      <div className="session-info stat-card">
        {activeSession ? (
          <>
            <p className="stat-label">Current Session Started</p>
            <p className="stat-value">{new Date(activeSession.check_in_time).toLocaleTimeString()}</p>
            <button
              onClick={handleCheckOut}
              disabled={geoLoading}
              className="btn btn-danger w-full"
            >
              {geoLoading ? <Loader2 className="animate-spin mr-2" /> : <LogOut className="mr-2" />}
              Check Out
            </button>
          </>
        ) : (
          <>
            <p className="text-secondary mb-4">Ready to start your shift?</p>
            <button
              onClick={handleCheckIn}
              disabled={geoLoading}
              className="btn btn-primary w-full"
            >
              {geoLoading ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2" />}
              Check In
            </button>
          </>
        )}
      </div>

      {(error || geoError) && <div className="badge badge-error w-full text-center mt-4 p-2">
        <MapPin className="w-4 h-4 mr-2" /> {/* Added back MapPin icon */}
        {error || geoError}
      </div>}

      <div className="history mt-4">
        <h3 className="stat-label mb-2">Today's History</h3>
        <div className="log-list">
          {logs.map((log) => (
            <div key={log.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 text-sm">
              <span className="opacity-70">
                {new Date(log.check_in_time).toLocaleTimeString()} → {log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString() : '...'}
              </span>
              <span className="font-bold text-accent-primary">
                {log.total_hours ? `${log.total_hours.toFixed(2)}h` : '--'} {/* Used total_hours and toFixed(2) */}
              </span>
            </div>
          ))}
          {logs.length === 0 && <p className="text-xs text-muted">No sessions yet today.</p>}
        </div>
      </div>
    </div>
  )
}
