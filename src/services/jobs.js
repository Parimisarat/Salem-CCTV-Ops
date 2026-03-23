import { supabase } from '../lib/supabase'

export const jobsService = {
  /**
   * Get all customers
   */
  async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name')
    if (error) throw error
    return data
  },

  /**
   * Create a new job
   */
  async createJob(jobData) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Create a new customer
   */
  async createCustomer(customerData) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Get all jobs (for admin)
   */
  async getJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customer:customers(name),
        employee:employees!assigned_to(name)
      `)
      .order('scheduled_date', { ascending: false })
    if (error) throw error
    return data
  },

  /**
   * Get jobs assigned to an employee
   */
  async getAssignedJobs(employeeId) {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customer:customers(name, address)
      `)
      .eq('assigned_to', employeeId)
      .neq('status', 'completed')
      .order('scheduled_date', { ascending: true })
    if (error) throw error
    return data
  },

  /**
   * Start working on a job (Check-in)
   */
  async startWork(employeeId, jobId) {
    const { data, error } = await supabase
      .from('work_logs')
      .insert([{
        employee_id: employeeId,
        job_id: jobId,
        check_in_time: new Date().toISOString()
      }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Stop working on a job (Check-out)
   */
  async stopWork(workLogId) {
    const { data, error } = await supabase
      .from('work_logs')
      .update({
        check_out_time: new Date().toISOString()
      })
      .eq('id', workLogId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Get active work log for an employee
   */
  async getActiveWorkLog(employeeId) {
    const { data, error } = await supabase
      .from('work_logs')
      .select(`
        *,
        job:jobs(title, customer:customers(name))
      `)
      .eq('employee_id', employeeId)
      .is('check_out_time', null)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Get today's work logs for an employee
   */
  async getTodayWorkLogs(employeeId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('work_logs')
      .select(`
        *,
        job:jobs(title)
      `)
      .eq('employee_id', employeeId)
      .gte('check_in_time', today.toISOString())
      .not('check_out_time', 'is', null)
      .order('check_in_time', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Update a job
   */
  async updateJob(id, updates, userId) {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Update a customer
   */
  async updateCustomer(id, updates) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Delete a job
   */
  async deleteJob(id) {
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) throw error
    return true
  },

  /**
   * Delete a customer
   */
  async deleteCustomer(id) {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
    return true
  }
}
