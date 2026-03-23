import { useState, useEffect } from 'react'
import { reportingService } from '../services/reporting'
import { Download, FileText, TrendingUp, Calendar, Loader2, Briefcase } from 'lucide-react'
import { format, startOfMonth } from 'date-fns'

export default function ReportingPanel() {
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  useEffect(() => {
    fetchReport()
  }, [selectedMonth])

  async function fetchReport() {
    try {
      setLoading(true)
      const data = await reportingService.getMonthlyReport(selectedMonth)
      setReportData(data)
    } catch (err) {
      console.error('Fetch report error:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleExport() {
    const csvString = reportingService.convertToCSV(reportData)
    const filename = `attendance_report_${format(selectedMonth, 'yyyy_MM')}.csv`
    reportingService.downloadCSV(csvString, filename)
  }

  const totals = reportData.reduce((acc, curr) => ({
    hours: acc.hours + curr.totalHours,
    workHours: acc.workHours + curr.totalWorkHours,
    salary: acc.salary + curr.totalSalary
  }), { hours: 0, workHours: 0, salary: 0 })

  const overallEfficiency = totals.hours > 0 ? ((totals.workHours / totals.hours) * 100) : 0

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-accent-primary" />
          <input 
            type="month" 
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            className="bg-transparent border-none text-sm font-bold text-primary focus:outline-none cursor-pointer"
            style={{ colorScheme: 'dark' }}
          />
        </div>
        <button 
          onClick={handleExport} 
          disabled={loading || reportData.length === 0}
          className="btn btn-primary"
        >
          <Download size={16} className="mr-2" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-accent-primary/10 border-accent-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="stat-label text-accent-primary">Total Monthly Hours</p>
            <h3 className="text-3xl font-extrabold mt-1">{totals.hours.toFixed(2)}h</h3>
            <div className="mt-4 flex items-center gap-2 text-xs text-secondary">
              <TrendingUp size={14} className="text-green-400" />
              <span>Calculated from {reportData.length} employees</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <Calendar size={120} />
          </div>
        </div>

        <div className="card bg-accent-secondary/10 border-accent-secondary/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="stat-label text-accent-secondary">Estimated Payroll</p>
            <h3 className="text-3xl font-extrabold mt-1">₹{totals.salary.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs text-secondary">
              <FileText size={14} className="text-blue-400" />
              <span>Standard rates applied</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <TrendingUp size={120} />
          </div>
        </div>

        <div className="card bg-green-500/10 border-green-500/20 relative overflow-hidden md:col-span-2 lg:col-span-1">
          <div className="relative z-10">
            <p className="stat-label text-green-500">Overall Job Efficiency</p>
            <h3 className="text-3xl font-extrabold mt-1">{overallEfficiency.toFixed(1)}%</h3>
            <div className="mt-4 flex items-center gap-2 text-xs text-secondary">
              <Briefcase size={14} className="text-green-500" />
              <span>Time spent active on jobs</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <Briefcase size={120} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Total Hours</th>
                <th>Job Hours</th>
                <th>Efficiency</th>
                <th>Hourly Rate</th>
                <th className="text-right">Total Salary</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <Loader2 className="animate-spin inline-block w-8 h-8 text-accent-primary mb-2" />
                    <p className="text-muted">Calculating reports...</p>
                  </td>
                </tr>
              ) : reportData.map((row, idx) => (
                <tr key={idx}>
                  <td className="font-bold">{row.name}</td>
                  <td className="font-mono">{row.totalHours.toFixed(2)}h</td>
                  <td className="font-mono text-secondary">{row.totalWorkHours.toFixed(2)}h</td>
                  <td>
                    <span className={`badge ${row.efficiency > 80 ? 'badge-success' : row.efficiency > 50 ? 'badge-primary' : 'badge-warning'}`}>
                      {row.efficiency.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-secondary text-sm">₹{row.hourlyRate}/h</td>
                  <td className="text-right">
                    <span className="font-bold text-accent-primary">₹{row.totalSalary.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              {!loading && reportData.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 opacity-50">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>No logs found for this month.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
