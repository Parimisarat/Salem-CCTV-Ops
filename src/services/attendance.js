import { supabase } from '../lib/supabase'

/**
 * Attendance Service
 * Handles check-in, check-out, and session validation.
 */
export const attendanceService = {
  /**
   * Get the active attendance session for an employee
   * @param {string} employeeId 
   */
  async getActiveSession(employeeId) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .is('check_out_time', null)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      throw error
    }

    return data
  },

  /**
   * Check-in an employee
   */
  async checkIn(employeeId, location = null) {
    if (!navigator.onLine) {
      // OFFLINE HANDLING
      localStorage.setItem('offline_checkin', JSON.stringify({
        employee_id: employeeId,
        check_in_time: new Date().toISOString(),
        lat: location?.lat,
        lng: location?.lng
      }))
      return { id: 'offline-temp-id', employee_id: employeeId, check_in_time: new Date().toISOString() }
    }

    const activeSession = await this.getActiveSession(employeeId)
    if (activeSession) {
      throw new Error('You already have an active check-in session.')
    }

    const { data, error } = await supabase
      .from('attendance_logs')
      .insert([
        {
          employee_id: employeeId,
          check_in_time: new Date().toISOString(),
          check_in_lat: location?.lat,
          check_in_lng: location?.lng,
          source: 'web',
          notes: !location ? 'GPS Permission Denied or Failed' : null
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Check-out an employee
   */
  async checkOut(employeeId, location = null) {
    if (!navigator.onLine) {
      // OFFLINE HANDLING
      localStorage.setItem('offline_checkout', JSON.stringify({
        employee_id: employeeId,
        check_out_time: new Date().toISOString(),
        lat: location?.lat,
        lng: location?.lng
      }))
      return true
    }

    const activeSession = await this.getActiveSession(employeeId)
    if (!activeSession) {
      throw new Error('No active check-in session found. (Only ONE active session allowed)')
    }

    const updates = {
      check_out_time: new Date().toISOString(),
      check_out_lat: location?.lat,
      check_out_lng: location?.lng
    }
    
    if (!location && !activeSession.notes) {
      updates.notes = 'Checkout GPS Denied'
    }

    const { data, error } = await supabase
      .from('attendance_logs')
      .update(updates)
      .eq('id', activeSession.id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get today's logs for an employee
   * @param {string} employeeId 
   */
  async getTodayLogs(employeeId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('check_in_time', today.toISOString())
      .order('check_in_time', { ascending: false })

    if (error) throw error
    return data
  }
}
