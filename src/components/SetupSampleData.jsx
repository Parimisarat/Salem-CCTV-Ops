import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function SetupSampleData() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const deploySampleData = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      // 1. Get or Create Dummy Admin
      let adminError = await supabase.from('employees').upsert([
        { name: 'Admin Demo', email: 'admin@demo.com', role: 'admin', hourly_rate: 45.0 }
      ], { onConflict: 'email' })
      if (adminError.error) throw adminError.error

      const { data: admin } = await supabase.from('employees').select('id').eq('email', 'admin@demo.com').single()

      // 1b. Get or Create Employee
      let empError = await supabase.from('employees').upsert([
        { name: 'Employee Demo', email: 'employee@demo.com', role: 'employee', hourly_rate: 25.0 }
      ], { onConflict: 'email' })
      if (empError.error) throw empError.error

      const { data: emp } = await supabase.from('employees').select('id').eq('email', 'employee@demo.com').single()

      // 2. Create Customers
      const { data: cust1, error: e3 } = await supabase.from('customers').insert([
        { name: 'TechCorp Solutions ' + Date.now(), phone: '555-0101', address: '100 Silicon Ave' }
      ]).select().single()
      if (e3) throw e3

      const { data: cust2, error: e4 } = await supabase.from('customers').insert([
        { name: 'Downtown Cafe ' + Date.now(), phone: '555-0202', address: '55 Main Street' }
      ]).select().single()
      if (e4) throw e4

      // 3. Create Jobs
      const today = new Date()
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

      const { data: job1, error: e5 } = await supabase.from('jobs').insert([
        { customer_id: cust1.id, assigned_to: emp.id, title: 'Install NVR and 4 Cameras', description: 'Priority install.', status: 'completed', scheduled_date: yesterday.toISOString().split('T')[0] }
      ]).select().single()
      if (e5) throw e5

      const { data: job2, error: e6 } = await supabase.from('jobs').insert([
        { customer_id: cust2.id, assigned_to: emp.id, title: 'Routine Maintenance', description: 'Clean lenses.', status: 'in-progress', scheduled_date: today.toISOString().split('T')[0] }
      ]).select().single()
      if (e6) throw e6

      // 4. Create Attendance Logs (Yesterday)
      const checkInYest = new Date(yesterday)
      checkInYest.setHours(8, 0, 0, 0)
      const checkOutYest = new Date(yesterday)
      checkOutYest.setHours(16, 0, 0, 0)

      const { error: e7 } = await supabase.from('attendance_logs').insert([
        { employee_id: emp.id, check_in_time: checkInYest.toISOString(), check_out_time: checkOutYest.toISOString(), check_in_lat: 42.3601, check_in_lng: -71.0589, check_out_lat: 42.3601, check_out_lng: -71.0589, total_hours: 8.0, source: 'web' }
      ])
      if (e7) throw e7

      // 5. Create Work Logs
      const wIn1 = new Date(yesterday); wIn1.setHours(9, 0, 0, 0)
      const wOut1 = new Date(yesterday); wOut1.setHours(11, 0, 0, 0)
      
      const { error: e8 } = await supabase.from('work_logs').insert([
        { employee_id: emp.id, job_id: job1.id, check_in_time: wIn1.toISOString(), check_out_time: wOut1.toISOString(), total_hours: 2.0 }
      ])
      if (e8) throw e8

      setSuccess(true)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-white/5 text-center">
      {success ? (
        <div className="badge badge-success w-full p-3 font-bold">
          <CheckCircle size={14} className="mr-2 inline" />
          Sample Data Successfully Injected! You can sign up now.
        </div>
      ) : error ? (
        <div className="badge badge-error w-full p-3 mb-4">
          <AlertCircle size={14} className="mr-2 inline" />
          {error} (RLS Policies may be preventing anonymous writes)
        </div>
      ) : (
        <button 
          onClick={deploySampleData} 
          disabled={loading}
          className="btn btn-secondary w-full text-sm font-bold opacity-80 hover:opacity-100 transition-opacity"
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Database size={16} className="mr-2" />}
          One-Click Deploy Sample Data
        </button>
      )}
    </div>
  )
}
