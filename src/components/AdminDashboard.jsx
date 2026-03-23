import { useState, useEffect } from 'react'
import { adminService } from '../services/admin'
import ReportingPanel from './ReportingPanel'
import AdminJobManager from './AdminJobManager'
import { Users, Calendar, Filter, Edit, Plus, Save, X, Search, MoreVertical, FileText, List, Briefcase, Trash, Clock, MapPin } from 'lucide-react'

export default function AdminDashboard() {
  const [logs, setLogs] = useState([])
  const [workLogs, setWorkLogs] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ employeeId: '', date: '' })
  const [editingLog, setEditingLog] = useState(null)
  const [showAddLog, setShowAddLog] = useState(false)
  const [newLog, setNewLog] = useState({ employee_id: '', check_in_time: '', check_out_time: '', notes: '' })
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname
    if (path === '/admin/reports') return 'reports'
    if (path === '/admin/jobs') return 'jobs'
    return 'logs'
  })

  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    fetchData()

    // Handle back/forward for sub-tabs
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/admin/reports') setActiveTab('reports')
      else if (path === '/admin/jobs') setActiveTab('jobs')
      else if (path.startsWith('/admin')) setActiveTab('logs')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateToTab = (tab) => {
    setActiveTab(tab)
    const path = tab === 'logs' ? '/admin' : `/admin/${tab}`
    window.history.pushState({}, '', path)
  }

  async function handleAddLog(e) {
    e.preventDefault()
    try {
      await adminService.createManualLog(newLog, user.id)
      setShowAddLog(false)
      setNewLog({ employee_id: '', check_in_time: '', check_out_time: '', notes: '' })
      fetchData()
    } catch (err) {
      alert('Error adding log: ' + err.message)
    }
  }

  async function handleDeleteLog(id) {
    if (!confirm('Are you sure you want to delete this log?')) return
    try {
      await adminService.deleteLog(id)
      fetchData()
    } catch (err) {
      alert('Error deleting log: ' + err.message)
    }
  }

  async function fetchData() {
    setLoading(true)
    setApiError(null)
    try {
      // Fetch individually so one failure doesn't crash the whole dashboard
      const logsPromise = adminService.getAllLogs().catch(e => { console.error(e); setApiError(prev => (prev ? prev + ' | ' : '') + 'Logs Error: ' + e.message); return [] })
      const empPromise = adminService.getEmployees().catch(e => { console.error(e); setApiError(prev => (prev ? prev + ' | ' : '') + 'Emp Error: ' + e.message); return [] })
      const workLogsPromise = adminService.getAllWorkLogs().catch(e => { console.error(e); setApiError(prev => (prev ? prev + ' | ' : '') + 'WorkLogs Error: ' + e.message); return [] })

      const [logsData, employeesData, workLogsData] = await Promise.all([logsPromise, empPromise, workLogsPromise])
      
      setLogs(logsData)
      setEmployees(employeesData)
      setWorkLogs(workLogsData)
    } catch (err) {
      console.error('Fetch admin data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesEmployee = !filter.employeeId || log.employee_id === filter.employeeId
    const logDate = new Date(log.check_in_time).toISOString().split('T')[0]
    const matchesDate = !filter.date || logDate === filter.date
    return matchesEmployee && matchesDate
  })

  async function handleUpdateLog(e) {
    e.preventDefault()
    try {
      await adminService.updateLog(editingLog.id, {
        check_in_time: editingLog.check_in_time,
        check_out_time: editingLog.check_out_time,
        notes: editingLog.notes
      }, user.id)
      setEditingLog(null)
      fetchData()
    } catch (err) {
      alert('Error updating log: ' + err.message)
    }
  }

  if (loading) return <div className="p-8 text-center text-secondary">Loading admin dashboard...</div>

  return (
    <div className="flex flex-col gap-8">
      {apiError && (
        <div className="bg-red-500 text-white p-4 rounded-lg font-bold">
          Database Error: {apiError}
        </div>
      )}
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <h2 className="card-title text-xl">
          <Users className="text-accent-primary" /> 
          Admin Portal
        </h2>
        <div className="nav-tabs">
          <button 
            onClick={() => navigateToTab('logs')} 
            className={`nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
          >
            <List size={16} className="mr-2" /> Logs
          </button>
          <button 
            onClick={() => navigateToTab('reports')} 
            className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          >
            <FileText size={16} className="mr-2" /> Reports
          </button>
          <button 
            onClick={() => navigateToTab('jobs')} 
            className={`nav-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          >
            <Briefcase size={16} className="mr-2" /> Jobs
          </button>
          <button 
            onClick={() => navigateToTab('worklogs')} 
            className={`nav-btn ${activeTab === 'worklogs' ? 'active' : ''}`}
          >
            <Clock size={16} className="mr-2" /> Work Logs
          </button>
        </div>
        {activeTab === 'logs' && (
          <button onClick={() => setShowAddLog(true)} className="btn btn-primary">
            <Plus className="mr-2" /> Manual Log
          </button>
        )}
      </div>

      {activeTab === 'logs' ? (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                <Search size={16} className="text-muted" />
                <select 
                  value={filter.employeeId} 
                  onChange={(e) => setFilter({...filter, employeeId: e.target.value})}
                  className="bg-transparent border-none text-sm text-primary focus:outline-none cursor-pointer"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
                <Calendar size={16} className="text-muted" />
                <input 
                  type="date" 
                  value={filter.date}
                  onChange={(e) => setFilter({...filter, date: e.target.value})}
                  className="bg-transparent border-none text-sm text-primary focus:outline-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
            <div className="text-sm text-muted">
              Showing {filteredLogs.length} entries
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Duration</th>
                  <th>Source</th>
                  <th>GPS Location</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td className="font-bold">{log.employee?.name || 'Unknown'}</td>
                    <td className="text-secondary">{new Date(log.check_in_time).toLocaleDateString()}</td>
                    <td>{new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-accent-tertiary">Active</span>}</td>
                    <td className="font-mono text-accent-primary font-bold">{log.total_hours?.toFixed(2) || '0.00'}h</td>
                    <td>
                      <span className={`badge ${log.source === 'web' ? 'badge-success' : 'badge-warning'}`}>
                        {log.source}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 text-xs">
                        {log.check_in_lat && (
                          <a href={`https://maps.google.com/?q=${log.check_in_lat},${log.check_in_lng}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                            <MapPin size={10} /> IN: {log.check_in_lat.toFixed(4)}, {log.check_in_lng.toFixed(4)}
                          </a>
                        )}
                        {log.check_out_lat && (
                          <a href={`https://maps.google.com/?q=${log.check_out_lat},${log.check_out_lng}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                            <MapPin size={10} /> OUT: {log.check_out_lat.toFixed(4)}, {log.check_out_lng.toFixed(4)}
                          </a>
                        )}
                        {!log.check_in_lat && !log.check_out_lat && <span className="text-muted">N/A</span>}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingLog(log)} className="btn-secondary p-2 rounded-lg hover:text-accent-primary transition-colors bg-transparent border-none cursor-pointer">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteLog(log.id)} className="btn-secondary p-2 rounded-lg hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer">
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'reports' ? (
        <ReportingPanel />
      ) : activeTab === 'worklogs' ? (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="card-title">Daily Work Logs Tracker</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Job</th>
                  <th>Customer</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {workLogs.map(wl => {
                  const start = new Date(wl.check_in_time)
                  const end = wl.check_out_time ? new Date(wl.check_out_time) : null
                  const diffHours = end ? ((end - start) / (1000 * 60 * 60)).toFixed(2) : null
                  return (
                    <tr key={wl.id}>
                      <td className="font-bold">{wl.employee?.name || 'Unknown'}</td>
                      <td className="text-secondary">{start.toLocaleDateString()}</td>
                      <td className="font-bold">{wl.job?.title || 'Unknown Job'}</td>
                      <td>{wl.job?.customer?.name || 'N/A'}</td>
                      <td>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-accent-tertiary">Active</span>}</td>
                      <td className="font-mono text-accent-primary font-bold">{diffHours ? `${diffHours}h` : '...'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AdminJobManager />
      )}

      {editingLog && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="card-title">Edit Attendance Log</h3>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateLog} id="edit-log-form" className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Check In Time</label>
                  <input 
                    type="datetime-local" 
                    className="form-control"
                    value={new Date(editingLog.check_in_time).toISOString().slice(0, 16)}
                    onChange={(e) => setEditingLog({...editingLog, check_in_time: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Check Out Time</label>
                  <input 
                    type="datetime-local" 
                    className="form-control"
                    value={editingLog.check_out_time ? new Date(editingLog.check_out_time).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditingLog({...editingLog, check_out_time: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    value={editingLog.notes || ''}
                    onChange={(e) => setEditingLog({...editingLog, notes: e.target.value})}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setEditingLog(null)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="edit-log-form" className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showAddLog && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="card-title">Add Manual Log</h3>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddLog} id="add-log-form" className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <select 
                    className="form-control"
                    value={newLog.employee_id} 
                    onChange={e => setNewLog({...newLog, employee_id: e.target.value})} 
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Check In Time</label>
                  <input type="datetime-local" className="form-control" onChange={e => setNewLog({...newLog, check_in_time: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Check Out Time</label>
                  <input type="datetime-local" className="form-control" onChange={e => setNewLog({...newLog, check_out_time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows="3" onChange={e => setNewLog({...newLog, notes: e.target.value})} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setShowAddLog(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="add-log-form" className="btn btn-primary">Save Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
