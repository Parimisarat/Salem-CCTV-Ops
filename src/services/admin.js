import { supabase } from '../lib/supabase'

export const adminService = {
  /**
   * Fetch all attendance logs with employee details
   */
  async getAllLogs() {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        employee:employees!employee_id(name, phone)
      `)
      .order('check_in_time', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Update an attendance log (Admin only)
   */
  async updateLog(logId, updates, adminId) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .update({
        ...updates,
        source: 'admin',
        updated_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', logId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a manual log entry
   */
  async createManualLog(logData, adminId) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert([
        {
          ...logData,
          source: 'admin',
          updated_by: adminId,
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete an attendance log
   */
  async deleteLog(logId) {
    const { error } = await supabase
      .from('attendance_logs')
      .delete()
      .eq('id', logId)

    if (error) throw error
    return true
  },

  /**
   * Get all employees for filtering
   */
  async getEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  /**
   * Fetch all work logs for admin
   */
  async getAllWorkLogs() {
    const { data, error } = await supabase
      .from('work_logs')
      .select(`
        *,
        employee:employees!employee_id(name),
        job:jobs(title, customer:customers(name))
      `)
      .order('check_in_time', { ascending: false })

    if (error) throw error
    return data
  }
}
