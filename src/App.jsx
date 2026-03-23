import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AttendancePanel from './components/AttendancePanel'
import AdminDashboard from './components/AdminDashboard'
import JobPanel from './components/JobPanel'
import Auth from './components/Auth'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loadingRole, setLoadingRole] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserRole(session.user.email)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchUserRole(session.user.email)
      } else {
        setUserRole(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchUserRole(email) {
    setLoadingRole(true)
    const { data } = await supabase
      .from('employees')
      .select('role')
      .eq('email', email)
      .single()
    if (data) setUserRole(data.role)
    setLoadingRole(false)
  }

  return (
    <div className="app-container">
      {!session ? (
        <Auth />
      ) : (
        <div className="dashboard">
          <header className="dashboard-header">
            <div className="flex items-center gap-4">
              <h1>SalemCCTV Ops</h1>
              {userRole && (
                <span className="badge badge-success ml-2">
                  {userRole === 'admin' ? 'Admin Gateway' : 'Employee Portal'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm opacity-70">{session.user.email}</span>
              <button onClick={() => supabase.auth.signOut()} className="btn btn-secondary">Sign Out</button>
            </div>
          </header>
          
          <main className="dashboard-content">
            {loadingRole ? (
               <div className="p-8 text-center text-muted">Loading your access...</div>
            ) : userRole === 'admin' ? (
              <AdminDashboard />
            ) : userRole === 'employee' ? (
              <div className="dashboard-grid">
                <AttendancePanel user={session.user} />
                <JobPanel user={session.user} />
              </div>
            ) : (
              <div className="p-8 text-center text-muted">Your account does not have an assigned role yet. Please contact an Administrator.</div>
            )}
          </main>
        </div>
      )}
    </div>
  )
}

export default App
