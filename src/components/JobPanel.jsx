import { useState, useEffect } from 'react'
import { jobsService } from '../services/jobs'
import { attendanceService } from '../services/attendance'
import { Briefcase, Play, Square, MapPin, Clock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function JobPanel({ user }) {
  const [jobs, setJobs] = useState([])
  const [activeWork, setActiveWork] = useState(null)
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeAttendance, setActiveAttendance] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [user.id])

  async function fetchJobs() {
    try {
      setLoading(true)
      const [assignedJobs, activeLog, logs, attendanceObj] = await Promise.all([
        jobsService.getAssignedJobs(user.id),
        jobsService.getActiveWorkLog(user.id),
        jobsService.getTodayWorkLogs(user.id),
        attendanceService.getActiveSession(user.id)
      ])
      setJobs(assignedJobs)
      setActiveWork(activeLog)
      setTodayLogs(logs)
      setActiveAttendance(attendanceObj)
    } catch (err) {
      console.error('Fetch jobs error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartWork(jobId) {
    try {
      await jobsService.startWork(user.id, jobId)
      await jobsService.updateJob(jobId, { status: 'in-progress' }, user.id)
      fetchJobs()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleStopWork() {
    try {
      await jobsService.stopWork(activeWork.id)
      fetchJobs()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleCompleteJob() {
    try {
      if (!confirm('Are you sure you want to mark this job as fully completed?')) return
      await jobsService.stopWork(activeWork.id)
      await jobsService.updateJob(activeWork.job_id, { status: 'completed', completed_at: new Date().toISOString() }, user.id)
      fetchJobs()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-4 text-center">Loading jobs...</div>

  return (
    <div className="card job-panel">
      <div className="card-header">
        <h2 className="card-title">
          <Briefcase className="mr-2" />
          My Jobs
        </h2>
      </div>

      {!activeAttendance && (
        <div className="bg-warning/20 border border-warning/30 text-warning p-3 rounded-lg mb-4 flex items-center text-sm">
          <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
          You must be Checked In to Attendance before starting a job.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {activeWork && (
          <div className="card bg-accent-primary/10 border-accent-primary/30 p-4 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="stat-label text-accent-primary">Currently Working On</p>
                <h3 className="text-xl font-bold mt-1">{activeWork.job?.title}</h3>
                <p className="text-sm text-secondary">{activeWork.job?.customer?.name}</p>
              </div>
              <div className="flex justify-end gap-2 mt-2 md:mt-0">
                <button 
                  onClick={handleStopWork}
                  className="btn btn-secondary btn-sm"
                  title="Pause timer without completing the job"
                >
                  <Square size={14} className="mr-1" /> Pause
                </button>
                <button 
                  onClick={handleCompleteJob}
                  className="btn btn-success btn-sm"
                  title="Stop timer and mark job as finished"
                >
                  <CheckCircle size={14} className="mr-1" /> Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {jobs.filter(job => job.id !== activeWork?.job_id).map(job => (
          <div key={job.id} className="card p-4 hover:border-accent-primary/20 transition-all">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold">{job.title}</h4>
                <div className="flex gap-4 mt-2 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="mr-1" />
                    {job.customer?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="mr-1" />
                    {job.scheduled_date}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleStartWork(job.id)}
                className="btn btn-secondary btn-sm"
                disabled={!!activeWork || !activeAttendance}
                title={!activeAttendance ? 'Check in first' : ''}
              >
                <Play size={14} className="mr-1" /> Start
              </button>
            </div>
          </div>
        ))}

        {jobs.length === 0 && !activeWork && (
          <div className="card bg-white/5 border-dashed border-white/10 flex flex-col items-center justify-center py-10 opacity-50">
            <CheckCircle className="w-8 h-8 opacity-20 mb-2" />
            <p>No jobs assigned</p>
          </div>
        )}
      </div>

      <div className="history mt-8">
        <h3 className="stat-label mb-4">Today's Work Logs</h3>
        <div className="log-list flex flex-col gap-2">
          {todayLogs.map(log => {
            const start = new Date(log.check_in_time)
            const end = new Date(log.check_out_time)
            const diffHours = (end - start) / (1000 * 60 * 60)
            return (
              <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                <div>
                  <span className="font-bold block mb-1">{log.job?.title || 'Unknown Job'}</span>
                  <span className="text-muted text-xs">
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="font-bold text-black border border-gray-200 px-2 py-1 rounded-md bg-white">
                  {diffHours.toFixed(1)}h
                </span>
              </div>
            )
          })}
          {todayLogs.length === 0 && <p className="text-xs text-muted">No completed jobs today.</p>}
        </div>
      </div>
    </div>
  )
}
