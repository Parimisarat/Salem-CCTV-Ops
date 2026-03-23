import { supabase } from '../lib/supabase'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export const reportingService = {
  /**
   * Generate monthly report for all employees
   * @param {Date} date - Any date within the target month
   */
  async getMonthlyReport(date) {
    const start = startOfMonth(date).toISOString()
    const end = endOfMonth(date).toISOString()

    // 1. Fetch all attendance logs for the month
    const { data: logs, error: logsError } = await supabase
      .from('attendance_logs')
      .select(`
        employee_id,
        total_hours,
        employee:employees!employee_id(name, hourly_rate)
      `)
      .gte('check_in_time', start)
      .lte('check_in_time', end)

    if (logsError) throw logsError

    // 1.5 Fetch all work logs for the month
    const { data: workLogs, error: workError } = await supabase
      .from('work_logs')
      .select(`employee_id, total_hours`)
      .gte('check_in_time', start)
      .lte('check_in_time', end)
    
    if (workError) throw workError

    // 2. Aggregate hours by employee
    const reportMap = {}

    logs.forEach(log => {
      const empId = log.employee_id
      if (!reportMap[empId]) {
        reportMap[empId] = {
          name: log.employee?.name || 'Unknown',
          hourlyRate: log.employee?.hourly_rate || 0,
          totalHours: 0,
          totalWorkHours: 0,
          totalSalary: 0,
          efficiency: 0
        }
      }
      reportMap[empId].totalHours += Number(log.total_hours || 0)
    })

    workLogs.forEach(wlog => {
      const empId = wlog.employee_id
      if (reportMap[empId]) {
        reportMap[empId].totalWorkHours += Number(wlog.total_hours || 0)
      }
    })

    // 3. Calculate salaries and efficiency
    const reportData = Object.values(reportMap).map(emp => {
      return {
        ...emp,
        totalSalary: emp.totalHours * emp.hourlyRate,
        efficiency: emp.totalHours > 0 ? ((emp.totalWorkHours / emp.totalHours) * 100) : 0
      }
    })

    return reportData
  },

  /**
   * Export report data to CSV string
   */
  convertToCSV(data) {
    const headers = ['Employee Name', 'Total Hours', 'Job Hours', 'Efficiency %', 'Hourly Rate', 'Total Salary']
    const rows = data.map(row => [
      row.name,
      row.totalHours.toFixed(2),
      row.totalWorkHours.toFixed(2),
      row.efficiency.toFixed(1) + '%',
      row.hourlyRate,
      row.totalSalary.toFixed(2)
    ])

    return [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')
  },

  /**
   * Trigger browser download of CSV
   */
  downloadCSV(csvString, filename) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
